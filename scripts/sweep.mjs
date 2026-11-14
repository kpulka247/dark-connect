// Opens a list of Garmin pages with the extension loaded, scans each one for
// parts the dark theme missed, and writes a report that marks what is new
// since the previous run.
//
//   pnpm sweep --login     Sign in to Garmin once. The session is kept in
//                          .sweep-profile/ for later runs.
//   pnpm sweep             Scan every page in scripts/sweep-pages.json.
//   pnpm sweep sleep hrv   Scan only pages whose path contains these words.
//
// Reports go to sweep-results/<date>/: report.md, findings.json and a
// screenshot per page.

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { FINDING_KINDS } from "../src/audit/scan.js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensionDir = path.join(root, "dist", "darkconnect-chrome");
const profileDir = path.join(root, ".sweep-profile");
const resultsDir = path.join(root, "sweep-results");
const pagesFile = path.join(root, "scripts", "sweep-pages.json");

const SETTLE_MS = 2500;

async function launch() {
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: "chromium",
    headless: false,
    viewport: { width: 1440, height: 900 },
    args: [
      `--disable-extensions-except=${extensionDir}`,
      `--load-extension=${extensionDir}`,
    ],
  });
  const worker =
    context.serviceWorkers()[0] ??
    (await context.waitForEvent("serviceworker"));
  await worker.evaluate(() => chrome.storage.local.set({ theme: "dark" }));
  return { context, worker };
}

async function login() {
  const { context } = await launch();
  const page = context.pages()[0] ?? (await context.newPage());
  await page.goto("https://connect.garmin.com/signin");
  console.log(
    "Sign in to Garmin Connect in the browser window, then close it.",
  );
  await new Promise((resolve) => context.on("close", resolve));
}

const isSignInPage = (url) =>
  /sso\.garmin\.com|\/signin/.test(new URL(url).host + new URL(url).pathname);

// Scrolls to the bottom so that lazily loaded cards and charts render.
async function scrollThrough(page) {
  await page.evaluate(async () => {
    for (let y = 0; y < document.body.scrollHeight; y += innerHeight / 2) {
      scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
    scrollTo(0, 0);
  });
}

// Sends the same message as the popup. The extension has no tabs permission,
// so the tab is found by asking each tab until one answers.
const scanTabs = (worker) =>
  worker.evaluate(async () => {
    for (const tab of await chrome.tabs.query({})) {
      try {
        const reply = await chrome.tabs.sendMessage(tab.id, {
          type: "dark-connect:scan",
        });
        if (reply?.darkThemeOn) return reply;
      } catch {
        // Not a Garmin page.
      }
    }
    return null;
  });

async function scanPage(context, worker, url, outDir) {
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    if (isSignInPage(page.url())) return { url, error: "signed-out" };
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await scrollThrough(page);
    await page.waitForTimeout(SETTLE_MS);

    const reply = await scanTabs(worker);
    if (!reply)
      return { url, error: "The extension did not run on this page." };

    const name =
      new URL(url).pathname.replace(/^\/|\/$/g, "").replace(/\//g, "_") ||
      "home";
    await page.screenshot({
      path: path.join(outDir, `${name}.png`),
      fullPage: true,
    });
    return { url, findings: reply.findings, screenshot: `${name}.png` };
  } catch (error) {
    return { url, error: error.message.split("\n")[0] };
  } finally {
    await page.close();
  }
}

async function previousRun(today) {
  const runs = (await readdir(resultsDir).catch(() => []))
    .filter((name) => name !== today)
    .sort();
  const last = runs.at(-1);
  if (!last) return null;
  try {
    const results = JSON.parse(
      await readFile(path.join(resultsDir, last, "findings.json"), "utf8"),
    );
    return { name: last, results };
  } catch {
    return null;
  }
}

const keyOf = (url, finding) => `${url}|${finding.kind}|${finding.selector}`;

function writeReport(results, previous) {
  const seen = new Set(
    previous?.results.flatMap((r) =>
      (r.findings ?? []).map((f) => keyOf(r.url, f)),
    ) ?? [],
  );
  const lines = [
    `# Dark Connect sweep, ${new Date().toISOString().slice(0, 10)}`,
    "",
    previous
      ? `**New** marks findings that were not in the run from ${previous.name}.`
      : "This is the first run, so nothing is compared.",
    "",
  ];

  for (const result of results) {
    lines.push(`## ${result.url}`, "");
    if (result.error) {
      lines.push(`Could not scan: ${result.error}`, "");
      continue;
    }
    if (result.findings.length === 0) {
      lines.push("Nothing found.", "");
      continue;
    }
    lines.push(
      `Screenshot: [${result.screenshot}](${result.screenshot})`,
      "",
      "| | Problem | Selector | Property | Color | Elements |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const f of result.findings) {
      const fresh =
        previous && !seen.has(keyOf(result.url, f)) ? "**New**" : "";
      const color = f.background ? `${f.color} on ${f.background}` : f.color;
      lines.push(
        `| ${fresh} | ${FINDING_KINDS[f.kind]} | \`${f.selector}\` | ${f.property} | ${color} | ${f.count} |`,
      );
    }
    lines.push("");
  }
  return lines.join("\n");
}

async function sweep(filters) {
  const pages = JSON.parse(await readFile(pagesFile, "utf8"));
  const urls = pages.filter(
    (url) => filters.length === 0 || filters.some((word) => url.includes(word)),
  );
  if (urls.length === 0) {
    console.error(
      `No page in ${path.relative(root, pagesFile)} matches ${filters.join(", ")}.`,
    );
    process.exit(1);
  }

  const today = new Date().toISOString().slice(0, 10);
  const outDir = path.join(resultsDir, today);
  await mkdir(outDir, { recursive: true });
  const previous = await previousRun(today);

  const { context, worker } = await launch();
  const results = [];
  for (const url of urls) {
    process.stdout.write(`${url} ... `);
    const result = await scanPage(context, worker, url, outDir);
    results.push(result);
    console.log(result.error ?? `${result.findings.length} finding(s)`);
    if (result.error === "signed-out") {
      console.error("\nGarmin signed you out. Run pnpm sweep --login first.");
      break;
    }
  }
  await context.close();

  await writeFile(
    path.join(outDir, "findings.json"),
    JSON.stringify(results, null, 2),
  );
  await writeFile(
    path.join(outDir, "report.md"),
    writeReport(results, previous),
  );
  console.log(
    `\nReport: ${path.relative(root, path.join(outDir, "report.md"))}`,
  );
}

const args = process.argv.slice(2);
if (args.includes("--login")) {
  await login();
} else {
  await sweep(args);
}
