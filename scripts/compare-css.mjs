// Compares two builds of a stylesheet and reports every change that can alter
// what a page looks like. Use it to prove that a CSS refactor is safe:
//
//   node scripts/compare-css.mjs <before.css> <after.css>
//
// For each selector and property it finds the declaration that wins inside
// that rule set, then checks two things:
//   1. Every selector still sets the same properties to the same values.
//   2. Two different selectors that set the same property to different values,
//      with the same specificity and !important flag, keep their order.
//      Without this, moving a rule to another file could change which one wins
//      on an element that both selectors match.
// Hex colours in attribute selectors, such as [fill="#F9F9F9"], are compared
// without case, so two case variants can be merged into one [... i] selector.

import { readFileSync } from "node:fs";
import postcss from "postcss";
import selectorParser from "postcss-selector-parser";

const HEX_ATTRIBUTE = /^#[0-9a-f]{3,8}$/i;

function normalizeSelector(selector) {
  let foldedCase = false;
  const normalized = selectorParser((root) => {
    root.walkAttributes((node) => {
      if (node.value && HEX_ATTRIBUTE.test(node.value)) {
        if (node.value !== node.value.toLowerCase() || node.insensitive) {
          foldedCase = true;
        }
        node.value = node.value.toLowerCase();
        node.insensitive = false;
      }
    });
    root.walk((node) => {
      if (node.spaces) node.spaces = { before: "", after: "" };
      if (node.type === "combinator" && node.value.trim()) {
        node.value = node.value.trim();
      }
    });
  }).processSync(selector, { lossless: false });
  return { key: normalized.replace(/\s+/g, " ").trim(), foldedCase };
}

function specificity(selector) {
  const score = [0, 0, 0];
  const add = (other) => other.forEach((value, i) => (score[i] += value));
  const visit = (container) => {
    container.each((node) => {
      switch (node.type) {
        case "id":
          score[0] += 1;
          break;
        case "class":
        case "attribute":
          score[1] += 1;
          break;
        case "tag":
          score[2] += 1;
          break;
        case "pseudo": {
          const name = node.value.toLowerCase();
          if (name === ":where") break;
          if ([":is", ":not", ":has", ":matches"].includes(name)) {
            let max = [0, 0, 0];
            node.each((inner) => {
              const s = specificityOfNode(inner);
              if (compareScores(s, max) > 0) max = s;
            });
            add(max);
          } else if (name.startsWith("::") || isLegacyPseudoElement(name)) {
            score[2] += 1;
          } else {
            score[1] += 1;
          }
          break;
        }
        default:
          break;
      }
    });
  };
  const specificityOfNode = (node) => {
    const saved = [...score];
    score.fill(0);
    visit(node);
    const result = [...score];
    saved.forEach((value, i) => (score[i] = value));
    return result;
  };
  selectorParser((root) => root.each((sel) => visit(sel))).processSync(
    selector,
  );
  return score.join(",");
}

function isLegacyPseudoElement(name) {
  return [":before", ":after", ":first-line", ":first-letter"].includes(name);
}

function compareScores(a, b) {
  for (let i = 0; i < 3; i += 1) {
    if (a[i] !== b[i]) return a[i] - b[i];
  }
  return 0;
}

function contextOf(node) {
  const parts = [];
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "atrule") {
      parts.unshift(`@${parent.name} ${parent.params}`.trim());
    }
  }
  return parts.join(" / ");
}

function normalizeValue(value) {
  return value
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ",")
    .replace(/\(\s+/g, "(")
    .replace(/\s+\)/g, ")")
    .trim();
}

function collect(file) {
  const root = postcss.parse(readFileSync(file, "utf8"), { from: file });
  const winners = new Map();
  const variants = new Map();
  let order = 0;

  root.walkDecls((decl) => {
    order += 1;
    const context = contextOf(decl);
    const rule = decl.parent;
    const inKeyframes = /@[a-z-]*keyframes/i.test(context);
    const selectors =
      rule.type === "rule" ? rule.selectors : [`@${rule.name} ${rule.params}`];

    for (const raw of selectors) {
      const isPlainRule = rule.type === "rule" && !inKeyframes;
      const { key: selector, foldedCase } = isPlainRule
        ? normalizeSelector(raw)
        : { key: raw.trim(), foldedCase: false };
      const prop = decl.prop.startsWith("--")
        ? decl.prop
        : decl.prop.toLowerCase();
      const entry = {
        context,
        selector,
        prop,
        value: normalizeValue(decl.value),
        important: decl.important,
        order,
        specificity: isPlainRule ? specificity(raw) : null,
        source: raw.trim(),
        line: decl.source?.start?.line,
      };
      const key = `${context}\u0000${selector}\u0000${prop}`;
      const current = winners.get(key);
      if (
        !current ||
        entry.important > current.important ||
        (entry.important === current.important && entry.order > current.order)
      ) {
        winners.set(key, entry);
      }
      if (foldedCase || selector !== raw.trim()) {
        const variantKey = `${key}\u0000${raw.trim()}`;
        const best = variants.get(variantKey);
        if (
          !best ||
          entry.important > best.important ||
          (entry.important === best.important && entry.order > best.order)
        ) {
          variants.set(variantKey, entry);
        }
      }
    }
  });

  return { winners, variants };
}

function describe(entry) {
  const where = entry.context ? ` (${entry.context})` : "";
  const flag = entry.important ? " !important" : "";
  return `${entry.source} { ${entry.prop}: ${entry.value}${flag} }${where}`;
}

function caseVariantConflicts(variants) {
  const groups = new Map();
  for (const [variantKey, entry] of variants) {
    const key = variantKey.split("\u0000").slice(0, 3).join("\u0000");
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(entry);
  }
  const problems = [];
  for (const entries of groups.values()) {
    const signatures = new Set(entries.map((e) => `${e.value}|${e.important}`));
    if (entries.length > 1 && signatures.size > 1) {
      problems.push(
        `Selectors that differ only by letter case set different values:\n    ${entries.map(describe).join("\n    ")}`,
      );
    }
  }
  return problems;
}

function orderConflicts(before, after) {
  const groups = new Map();
  for (const [key, entry] of before.winners) {
    if (entry.specificity === null) continue;
    const moved = after.winners.get(key);
    if (!moved) continue;
    const group = `${entry.prop}|${entry.important}|${entry.specificity}`;
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group).push({ before: entry, after: moved });
  }

  const problems = [];
  for (const items of groups.values()) {
    items.sort((a, b) => a.before.order - b.before.order);
    for (let i = 0; i < items.length; i += 1) {
      for (let j = i + 1; j < items.length; j += 1) {
        const first = items[i];
        const second = items[j];
        if (first.before.value === second.before.value) continue;
        if (first.before.selector === second.before.selector) continue;
        if (first.after.order > second.after.order) {
          problems.push(
            `These rules swapped order and could now win on a different element:\n    before: ${describe(first.before)}\n    then:   ${describe(second.before)}`,
          );
        }
      }
    }
  }
  return problems;
}

function compare(beforeFile, afterFile) {
  const before = collect(beforeFile);
  const after = collect(afterFile);
  const problems = [];

  for (const [key, entry] of before.winners) {
    const other = after.winners.get(key);
    if (!other) {
      problems.push(`Removed: ${describe(entry)}`);
    } else if (
      other.value !== entry.value ||
      other.important !== entry.important
    ) {
      problems.push(
        `Changed:\n    before: ${describe(entry)}\n    after:  ${describe(other)}`,
      );
    }
  }
  for (const [key, entry] of after.winners) {
    if (!before.winners.has(key)) problems.push(`Added: ${describe(entry)}`);
  }

  problems.push(...caseVariantConflicts(before.variants));
  problems.push(...orderConflicts(before, after));

  return { problems, count: before.winners.size };
}

const [beforeFile, afterFile] = process.argv.slice(2);
if (!beforeFile || !afterFile) {
  console.error("Usage: node scripts/compare-css.mjs <before.css> <after.css>");
  process.exit(2);
}

const { problems, count } = compare(beforeFile, afterFile);
if (problems.length === 0) {
  console.log(
    `No visible changes. Compared ${count} selector and property pairs.`,
  );
} else {
  console.log(problems.join("\n\n"));
  console.log(`\n${problems.length} difference(s) found.`);
  process.exit(1);
}
