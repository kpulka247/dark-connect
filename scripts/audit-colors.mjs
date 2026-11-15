import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  isSignInPage,
  launch,
  root,
  scrollThrough,
} from "./garmin-browser.mjs";

const pagesFile = path.join(root, "scripts", "sweep-pages.json");
const exceptionsFile = path.join(root, "scripts", "color-exceptions.json");
const variablesFile = path.join(root, "src", "styles", "base", "variables.css");
const outDir = path.join(root, "sweep-results", "colors");
const SETTLE_MS = 2500;

const LINK_BLUE = "#99c8ff";
const MIN_SAMPLES = 5;
const MIN_SHARE = 0.5;
const MIN_DISTANCE = 40;

const LINK_KINDS = {
  "turned-blue": "Text that was not blue turned link blue",
  "lost-blue": "A blue link lost its blue",
  "other-blue": "Blue text that is not the theme's link blue",
};

function collect(variables) {
  const MODULE_CLASS = /^(.+_.+)__[A-Za-z0-9_-]{5}$/;
  const SKIP =
    "#dc-modal-overlay, svg, canvas, img, video, .leaflet-control-attribution, .gm-style-cc";
  const SIDES = ["top", "right", "bottom", "left"];

  const hex = (value) => {
    const match = value.match(/rgba?\(([^)]+)\)/);
    if (!match) return null;
    const [r, g, b, a = 1] = match[1].split(/[\s,/]+/).map(Number);
    if (a < 0.1) return null;
    const alpha =
      a < 1
        ? Math.round(a * 255)
            .toString(16)
            .padStart(2, "0")
        : "";
    return `#${[r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("")}${alpha}`;
  };
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
  const read = (element) => {
    const style = getComputedStyle(element);
    const side = SIDES.find(
      (name) => parseFloat(style.getPropertyValue(`border-${name}-width`)) > 0,
    );
    return {
      color: style.color,
      "background-color": style.backgroundColor,
      "border-color": side
        ? style.getPropertyValue(`border-${side}-color`)
        : "",
    };
  };

  const elements = [...document.body.querySelectorAll("*")].filter(
    (element) => {
      if (element.closest(SKIP)) return false;
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
  const themed = elements.map(read);
  const rootStyle = getComputedStyle(document.documentElement);
  const probe = document.createElement("i");
  document.body.append(probe);
  const palette = {};
  for (const name of variables) {
    const value = rootStyle.getPropertyValue(name).trim();
    if (!value) continue;
    probe.style.color = "";
    probe.style.color = value;
    const color = probe.style.color && hex(getComputedStyle(probe).color);
    if (color) (palette[color] ??= []).push(name);
  }
  probe.remove();
  theme.disabled = true;
  const original = elements.map(read);
  theme.disabled = false;
  freeze.remove();

  const groups = new Map();
  elements.forEach((element, index) => {
    const ownText = [...element.childNodes].some(
      (node) => node.nodeType === Node.TEXT_NODE && node.textContent.trim(),
    );
    const rect = element.getBoundingClientRect();
    for (const property of Object.keys(themed[index])) {
      if (property === "color" && !ownText) continue;
      if (property === "background-color" && rect.width * rect.height < 400) {
        continue;
      }
      const before = hex(original[index][property]);
      const after = hex(themed[index][property]);
      if (!before || !after) continue;
      const key = `${property}|${selector(element)}|${before}|${after}`;
      const group = groups.get(key) ?? {
        property,
        selector: selector(element),
        original: before,
        themed: after,
        link: Boolean(element.closest("a, button")),
        count: 0,
        sample: element.textContent.trim().replace(/\s+/g, " ").slice(0, 40),
      };
      group.count += 1;
      groups.set(key, group);
    }
  });
  return { palette, samples: [...groups.values()] };
}

const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const distance = (a, b) => {
  const [x, y] = [rgb(a), rgb(b)];
  return Math.hypot(x[0] - y[0], x[1] - y[1], x[2] - y[2]);
};
const isBlue = (hex) => {
  const [r, g, b] = rgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max !== b || max - min < 60) return false;
  const hue = 60 * (4 + (r - g) / (max - min));
  return hue >= 190 && hue <= 240;
};

function linkKind({ property, original, themed }) {
  if (property !== "color") return null;
  if (isBlue(themed) && !isBlue(original)) return "turned-blue";
  if (isBlue(original) && !isBlue(themed)) return "lost-blue";
  if (isBlue(themed) && distance(themed, LINK_BLUE) > 20) return "other-blue";
  return null;
}

function merge(results) {
  const merged = new Map();
  for (const { url, samples } of results) {
    for (const sample of samples) {
      const key = `${sample.property}|${sample.selector}|${sample.original}|${sample.themed}`;
      const entry = merged.get(key) ?? { ...sample, count: 0, pages: [] };
      entry.count += sample.count;
      entry.pages.push(new URL(url).pathname);
      merged.set(key, entry);
    }
  }
  return [...merged.values()];
}

function mappings(samples) {
  const byOriginal = new Map();
  for (const sample of samples) {
    const key = `${sample.property}|${sample.original}`;
    const entry = byOriginal.get(key) ?? {
      property: sample.property,
      original: sample.original,
      total: 0,
      themed: new Map(),
    };
    entry.total += 1;
    entry.themed.set(sample.themed, (entry.themed.get(sample.themed) ?? 0) + 1);
    byOriginal.set(key, entry);
  }
  for (const entry of byOriginal.values()) {
    const [majority, count] = [...entry.themed].sort((a, b) => b[1] - a[1])[0];
    entry.majority = majority;
    entry.share = count / entry.total;
  }
  return byOriginal;
}

const cell = (text) => text.replace(/\|/g, "/");
const pagesCell = (pages) =>
  `${pages.length}: ${pages.slice(0, 2).join(", ")}${pages.length > 2 ? ", …" : ""}`;

function report(samples, palette, exceptions) {
  const isException = (sample) =>
    exceptions.some(
      (rule) =>
        rule.selector === sample.selector &&
        (!rule.property || rule.property === sample.property),
    );
  const variable = (color) =>
    palette[color] ? `var(${palette[color][0]})` : color;
  const lines = ["# Colors with and without Dark Connect", ""];
  let issues = 0;

  for (const [kind, title] of Object.entries(LINK_KINDS)) {
    const rows = samples
      .filter((s) => linkKind(s) === kind && !isException(s))
      .sort((a, b) => b.count - a.count);
    issues += rows.length;
    lines.push(`## ${title}`, "");
    if (rows.length === 0) {
      lines.push("None.", "");
      continue;
    }
    lines.push("| Selector | Without | With | Pages | Count | Text |");
    lines.push("| --- | --- | --- | --- | --- | --- |");
    for (const s of rows) {
      lines.push(
        `| \`${s.selector}\` | ${s.original} | ${s.themed} | ${pagesCell(s.pages)} | ${s.count} | ${cell(s.sample)} |`,
      );
    }
    lines.push("");
  }

  const rules = mappings(samples);
  lines.push(
    "## Inconsistent shades",
    "",
    `For each Garmin color, the themed color used most often is the theme's rule. These elements use a visibly different shade. Each selector counts once, however often it appears, and a rule needs at least ${MIN_SAMPLES} selectors and a ${MIN_SHARE * 100}% majority.`,
    "",
  );
  const groups = [...rules.values()]
    .filter((rule) => rule.total >= MIN_SAMPLES && rule.share >= MIN_SHARE)
    .map((rule) => ({
      rule,
      rows: samples
        .filter(
          (s) =>
            s.property === rule.property &&
            s.original === rule.original &&
            distance(s.themed, rule.majority) > MIN_DISTANCE &&
            !linkKind(s) &&
            !isException(s),
        )
        .sort((a, b) => b.count - a.count),
    }))
    .filter(({ rows }) => rows.length > 0)
    .sort(
      (a, b) =>
        b.rows.reduce((n, s) => n + s.count, 0) -
        a.rows.reduce((n, s) => n + s.count, 0),
    );
  if (groups.length === 0) lines.push("None.", "");
  for (const { rule, rows } of groups) {
    issues += rows.length;
    lines.push(
      `### \`${rule.property}\` ${rule.original} usually becomes ${rule.majority} (${variable(rule.majority)}), ${Math.round(rule.share * 100)}% of ${rule.total}`,
      "",
      "| Selector | With | Pages | Count | Text | Suggested rule |",
      "| --- | --- | --- | --- | --- | --- |",
    );
    for (const s of rows) {
      lines.push(
        `| \`${s.selector}\` | ${s.themed} | ${pagesCell(s.pages)} | ${s.count} | ${cell(s.sample)} | \`${s.selector} { ${s.property}: ${variable(rule.majority)} !important; }\` |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## The theme's color rules",
    "",
    "| Property | Without | Usually with | Share | Selectors |",
    "| --- | --- | --- | --- | --- |",
  );
  for (const rule of [...rules.values()]
    .filter((rule) => rule.total >= MIN_SAMPLES)
    .sort((a, b) => b.total - a.total)) {
    lines.push(
      `| ${rule.property} | ${rule.original} | ${rule.majority} (${variable(rule.majority)}) | ${Math.round(rule.share * 100)}% | ${rule.total} |`,
    );
  }
  lines.push("");
  return { text: lines.join("\n"), issues };
}

const args = process.argv.slice(2);
const exceptions = JSON.parse(await readFile(exceptionsFile, "utf8"));
const dataFile = path.join(outDir, "samples.json");
let data;
if (args.includes("--report")) {
  data = JSON.parse(await readFile(dataFile, "utf8"));
} else {
  const pages = JSON.parse(await readFile(pagesFile, "utf8")).filter(
    (url) => args.length === 0 || args.some((word) => url.includes(word)),
  );
  const variables = [
    ...(await readFile(variablesFile, "utf8")).matchAll(/^\s*(--[\w-]+)\s*:/gm),
  ].map((match) => match[1]);
  const { context } = await launch();
  const results = [];
  let palette = {};
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
      const result = await page.evaluate(collect, variables);
      palette = { ...result.palette, ...palette };
      results.push({ url, samples: result.samples });
      console.log(`${result.samples.length} color pair(s)`);
    } catch (error) {
      console.log(error.message.split("\n")[0]);
    } finally {
      await page.close();
    }
  }
  await context.close();
  data = { palette, samples: merge(results) };
  await mkdir(outDir, { recursive: true });
  await writeFile(dataFile, JSON.stringify(data, null, 2));
}

const { text, issues } = report(data.samples, data.palette, exceptions);
await writeFile(path.join(outDir, "report.md"), text);
console.log(
  `\n${issues} issue(s). Report: ${path.relative(root, path.join(outDir, "report.md"))}`,
);
