import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  isSignInPage,
  launch,
  root,
  scrollThrough,
} from "./garmin-browser.mjs";

const pagesFile = path.join(root, "scripts", "sweep-pages.json");
const outDir = path.join(root, "sweep-results", "text-colors");
const SETTLE_MS = 2500;

const KINDS = {
  "turned-blue": "Text that was not blue turned link blue",
  "lost-blue": "A blue link lost its blue",
  "other-blue": "Blue text that is not the theme's link blue",
};

function collect() {
  const MODULE_CLASS = /^(.+_.+)__[A-Za-z0-9_-]{5}$/;
  const LINK_BLUE = [153, 200, 255];

  const rgb = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).map(Number);
    return a < 0.1 ? null : [r, g, b];
  };
  const isBlue = ([r, g, b]) => {
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max !== b || max - min < 60) return false;
    const hue = 60 * (4 + (r - g) / (max - min));
    return hue >= 190 && hue <= 240;
  };
  const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 12);
  const hex = ([r, g, b]) =>
    `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
  const selector = (element) => {
    const parts = [];
    for (
      let node = element;
      node && parts.length < 3;
      node = node.parentElement
    ) {
      const classes = [...node.classList].map((name) => {
        const module = name.match(MODULE_CLASS);
        return module
          ? `[class*="${module[1]}_"]`
          : /^[A-Za-z][\w-]*$/.test(name)
            ? `.${name}`
            : "";
      });
      parts.unshift(
        node.tagName.toLowerCase() +
          classes.filter(Boolean).slice(0, 2).join(""),
      );
      if (classes.some(Boolean)) break;
    }
    return parts.join(" > ");
  };

  const elements = [...document.body.querySelectorAll("*")].filter(
    (element) => {
      if (
        element.closest(
          "#dc-modal-overlay, svg, .leaflet-control-attribution, .gm-style-cc",
        )
      ) {
        return false;
      }
      const ownText = [...element.childNodes].some(
        (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
      );
      if (!ownText) return false;
      const rect = element.getBoundingClientRect();
      return (
        rect.width > 0 &&
        rect.height > 0 &&
        element.checkVisibility?.() !== false
      );
    },
  );

  const freeze = document.createElement("style");
  freeze.textContent =
    "*, *::before, *::after { transition: none !important; animation: none !important; }";
  document.head.append(freeze);
  const theme = document.getElementById("dark-connect-style");
  const themed = elements.map((element) => getComputedStyle(element).color);
  theme.disabled = true;
  const original = elements.map((element) => getComputedStyle(element).color);
  theme.disabled = false;
  freeze.remove();

  const groups = new Map();
  elements.forEach((element, index) => {
    const before = rgb(original[index]);
    const after = rgb(themed[index]);
    if (!before || !after) return;
    let kind = null;
    if (isBlue(after) && !isBlue(before)) kind = "turned-blue";
    else if (isBlue(before) && !isBlue(after)) kind = "lost-blue";
    else if (isBlue(after) && !near(after, LINK_BLUE)) kind = "other-blue";
    if (!kind) return;
    const key = `${kind}|${selector(element)}|${hex(before)}|${hex(after)}`;
    const group = groups.get(key) ?? {
      kind,
      selector: selector(element),
      original: hex(before),
      themed: hex(after),
      link: Boolean(element.closest("a, button")),
      count: 0,
      sample: element.textContent.trim().slice(0, 40),
    };
    group.count += 1;
    groups.set(key, group);
  });
  return [...groups.values()];
}

const filters = process.argv.slice(2);
const pages = JSON.parse(await readFile(pagesFile, "utf8")).filter(
  (url) => filters.length === 0 || filters.some((word) => url.includes(word)),
);

await mkdir(outDir, { recursive: true });
const { context } = await launch();
const results = [];
for (const url of pages) {
  process.stdout.write(`${url} ... `);
  const page = await context.newPage();
  try {
    await page.goto(url, { waitUntil: "load", timeout: 60_000 });
    if (isSignInPage(page.url())) {
      console.error("\nGarmin signed you out. Run pnpm sweep --login first.");
      break;
    }
    await page
      .waitForLoadState("networkidle", { timeout: 15_000 })
      .catch(() => {});
    await scrollThrough(page);
    await page.waitForTimeout(SETTLE_MS);
    const findings = await page.evaluate(collect);
    results.push({ url, findings });
    console.log(`${findings.length} finding(s)`);
  } catch (error) {
    console.log(error.message.split("\n")[0]);
  } finally {
    await page.close();
  }
}
await context.close();

const lines = ["# Text colors with and without Dark Connect", ""];
for (const [kind, title] of Object.entries(KINDS)) {
  lines.push(`## ${title}`, "");
  lines.push("| Page | Selector | Without | With | In link | Count | Text |");
  lines.push("| --- | --- | --- | --- | --- | --- | --- |");
  for (const { url, findings } of results) {
    for (const f of findings.filter((f) => f.kind === kind)) {
      const page = new URL(url).pathname;
      lines.push(
        `| ${page} | \`${f.selector}\` | ${f.original} | ${f.themed} | ${f.link ? "yes" : "no"} | ${f.count} | ${f.sample.replace(/\|/g, "/")} |`,
      );
    }
  }
  lines.push("");
}
await writeFile(
  path.join(outDir, "findings.json"),
  JSON.stringify(results, null, 2),
);
await writeFile(path.join(outDir, "report.md"), lines.join("\n"));
console.log(`\nReport: ${path.relative(root, path.join(outDir, "report.md"))}`);
