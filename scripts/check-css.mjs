// Fails when a stylesheet rule can never take effect:
//   - a declaration that a later declaration of the same property on the same
//     selector always overrides, usually a copy of a rule in another file;
//   - a selector in a list whose every property is overridden that way.
// Files are read in the order of the @import lines in src/styles/index.css,
// which is the order they have in the built stylesheet.
//
//   node scripts/check-css.mjs

import { readFileSync } from "node:fs";
import path from "node:path";
import postcss from "postcss";

const STYLES = "src/styles";
const index = readFileSync(path.join(STYLES, "index.css"), "utf8");
const files = [...index.matchAll(/@import "(.+?)"/g)].map((match) =>
  path.join(STYLES, match[1]),
);

function contextOf(node) {
  const parts = [];
  for (let parent = node.parent; parent; parent = parent.parent) {
    if (parent.type === "atrule")
      parts.unshift(`@${parent.name} ${parent.params}`);
  }
  return parts.join(" / ");
}

const normalize = (selector) => selector.replace(/\s+/g, " ").trim();

const declarations = [];
let order = 0;
for (const file of files) {
  const root = postcss.parse(readFileSync(file, "utf8"), { from: file });
  root.walkDecls((decl) => {
    order += 1;
    const context = contextOf(decl);
    if (decl.parent.type !== "rule" || /keyframes/i.test(context)) return;
    declarations.push({
      decl,
      file,
      order,
      context,
      prop: decl.prop.startsWith("--") ? decl.prop : decl.prop.toLowerCase(),
      selectors: decl.parent.selectors.map(normalize),
    });
  });
}

const keyOf = (entry, selector) =>
  `${entry.context}\u0000${selector}\u0000${entry.prop}`;
const beats = (a, b) =>
  a.decl.important > b.decl.important ||
  (a.decl.important === b.decl.important && a.order > b.order);

const winners = new Map();
for (const entry of declarations) {
  for (const selector of entry.selectors) {
    const key = keyOf(entry, selector);
    const current = winners.get(key);
    if (!current || beats(entry, current)) winners.set(key, entry);
  }
}

const where = (entry) => `${entry.file}:${entry.decl.source.start.line}`;
const problems = [];

for (const entry of declarations) {
  const lost = entry.selectors.filter(
    (selector) => winners.get(keyOf(entry, selector)) !== entry,
  );
  if (lost.length === entry.selectors.length) {
    const winner = winners.get(keyOf(entry, entry.selectors[0]));
    problems.push(
      `${where(entry)}  "${entry.prop}" never applies. ${where(winner)} overrides it for the same selector.`,
    );
  }
}

const rules = new Map();
for (const entry of declarations) {
  const rule = entry.decl.parent;
  if (!rules.has(rule)) rules.set(rule, []);
  rules.get(rule).push(entry);
}
for (const [rule, entries] of rules) {
  if (rule.selectors.length < 2) continue;
  for (const selector of entries[0].selectors) {
    const applies = entries.some(
      (entry) => winners.get(keyOf(entry, selector)) === entry,
    );
    const allDead = entries.every((entry) =>
      entry.selectors.every((s) => winners.get(keyOf(entry, s)) !== entry),
    );
    if (!applies && !allDead) {
      problems.push(
        `${entries[0].file}:${rule.source.start.line}  "${selector}" has no effect in this rule. Later rules override every property it sets.`,
      );
    }
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  console.error(
    `\n${problems.length} rule(s) never take effect. Remove them or merge them into the rule that wins.`,
  );
  process.exit(1);
}
console.log(
  `Checked ${declarations.length} declarations in ${files.length} files.`,
);
