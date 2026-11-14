// Finds the parts of a Garmin page that the dark theme missed: light surfaces,
// dark text on a dark background, and light chart shapes. Each finding comes
// with a selector in the same style as the stylesheets, so it can be pasted
// into a rule.

const LIGHT = 0.7;
const DARK_TEXT_CONTRAST = 2;
const MIN_SURFACE_AREA = 600;
const MIN_CHART_SHAPE_AREA = 1500;
const MAX_ANCESTOR_STEPS = 3;

const SKIPPED_TAGS = new Set([
  "HTML",
  "HEAD",
  "SCRIPT",
  "STYLE",
  "LINK",
  "META",
  "NOSCRIPT",
  "TEMPLATE",
  "IMG",
  "PICTURE",
  "VIDEO",
  "CANVAS",
  "IFRAME",
  "OBJECT",
  "EMBED",
]);
const CHART_SHAPES = new Set(["rect", "path", "circle", "ellipse", "polygon"]);
const CHART_TEXT = new Set(["text", "tspan"]);
const OWN_UI = "#dc-modal-overlay";

// Garmin builds class names as Component_local__hash. The hash changes on
// every deploy, so the stylesheets match the part before it.
const MODULE_CLASS = /^(.+_.+)__[A-Za-z0-9_-]{5}$/;

export const FINDING_KINDS = {
  "light-surface": "Light background",
  "dark-text": "Dark text",
  "light-chart-shape": "Light chart shape",
  "dark-chart-text": "Dark chart text",
};

let colorContext;

export function parseColor(value) {
  if (!value || value === "transparent" || value === "none") return null;
  let match = value.match(
    /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
  );
  if (!match) {
    colorContext ??= document.createElement("canvas").getContext("2d");
    colorContext.fillStyle = "#000";
    colorContext.fillStyle = value;
    const normalized = colorContext.fillStyle;
    const hex = normalized.match(/^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i);
    if (hex) {
      return {
        r: parseInt(hex[1], 16),
        g: parseInt(hex[2], 16),
        b: parseInt(hex[3], 16),
        a: 1,
      };
    }
    match = normalized.match(
      /^rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:\s*[,/]\s*([\d.]+%?))?\s*\)$/,
    );
    if (!match) return null;
  }
  let alpha = match[4] === undefined ? 1 : parseFloat(match[4]);
  if (match[4]?.endsWith("%")) alpha /= 100;
  return { r: +match[1], g: +match[2], b: +match[3], a: alpha };
}

export function luminance({ r, g, b }) {
  const channel = (value) => {
    const c = value / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

export function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

export function toHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((c) => Math.round(c).toString(16).padStart(2, "0"))
    .join("")}`;
}

export function stablePrefix(className) {
  const match = className.match(MODULE_CLASS);
  return match ? `${match[1]}_` : null;
}

function isStablePlainClass(className) {
  return (
    /^[A-Za-z][A-Za-z-]*$/.test(className) && !MODULE_CLASS.test(className)
  );
}

function ownSelector(element) {
  const tag = element.localName;
  const classes = [...element.classList];
  const prefix = classes.map(stablePrefix).find(Boolean);
  if (prefix) return `${tag}[class*="${prefix}"]`;

  const plain = classes.filter(isStablePlainClass).slice(0, 2);
  if (plain.length) return `${tag}.${plain.join(".")}`;
  if (element.id && /^[A-Za-z][A-Za-z_-]*$/.test(element.id)) {
    return `${tag}#${element.id}`;
  }
  return null;
}

export function selectorFor(element) {
  const own = ownSelector(element);
  if (own) return own;

  const path = [element.localName];
  let current = element.parentElement;
  for (let step = 0; current && step < MAX_ANCESTOR_STEPS; step += 1) {
    const selector = ownSelector(current);
    if (selector) return `${selector} ${path.join(" > ")}`;
    path.unshift(current.localName);
    current = current.parentElement;
  }
  return path.join(" > ");
}

function isVisible(element, style, rect) {
  if (rect.width < 1 || rect.height < 1) return false;
  if (style.visibility === "hidden" || style.display === "none") return false;
  if (typeof element.checkVisibility === "function") {
    return element.checkVisibility({
      opacityProperty: true,
      visibilityProperty: true,
    });
  }
  return parseFloat(style.opacity) > 0;
}

function createBackgroundResolver(view) {
  const cache = new Map();
  const pageBackground =
    parseColor(
      view.getComputedStyle(document.documentElement).backgroundColor,
    ) ?? parseColor(view.getComputedStyle(document.body).backgroundColor);

  // Returns the colour behind an element's text, or null when an image is
  // behind it and the colour cannot be known.
  const resolve = (element) => {
    if (!element || element === document.documentElement) {
      return pageBackground?.a >= 0.5
        ? pageBackground
        : { r: 255, g: 255, b: 255, a: 1 };
    }
    if (cache.has(element)) return cache.get(element);

    const style = view.getComputedStyle(element);
    const color = parseColor(style.backgroundColor);
    let result;
    if (color && color.a >= 0.5) {
      result = color;
    } else if (style.backgroundImage !== "none") {
      result = null;
    } else {
      result = resolve(element.parentElement);
    }
    cache.set(element, result);
    return result;
  };
  return resolve;
}

function hasOwnText(element) {
  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE && node.textContent.trim())
      return true;
  }
  return false;
}

function inspect(element, view, backgroundOf, add) {
  const tag = element.localName;
  const isSvg = element instanceof SVGElement;
  const style = view.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  if (!isVisible(element, style, rect)) return;
  const area = rect.width * rect.height;

  if (isSvg) {
    if (CHART_SHAPES.has(tag) && area >= MIN_CHART_SHAPE_AREA) {
      const fill = parseColor(style.fill);
      if (
        fill &&
        fill.a >= 0.5 &&
        parseFloat(style.fillOpacity) >= 0.5 &&
        luminance(fill) >= LIGHT
      ) {
        add("light-chart-shape", element, {
          property: "fill",
          color: fill,
          area,
        });
      }
    } else if (CHART_TEXT.has(tag) && hasOwnText(element)) {
      const fill = parseColor(style.fill);
      const background = backgroundOf(element.closest("svg")?.parentElement);
      if (
        fill &&
        fill.a >= 0.5 &&
        background &&
        contrast(fill, background) < DARK_TEXT_CONTRAST &&
        luminance(background) < 0.2
      ) {
        add("dark-chart-text", element, {
          property: "fill",
          color: fill,
          background,
          area,
        });
      }
    }
    return;
  }

  const background = parseColor(style.backgroundColor);
  if (
    background &&
    background.a >= 0.5 &&
    area >= MIN_SURFACE_AREA &&
    rect.width >= 12 &&
    rect.height >= 12 &&
    luminance(background) >= LIGHT
  ) {
    add("light-surface", element, {
      property: "background-color",
      color: background,
      area,
    });
  }

  if (hasOwnText(element)) {
    const text = parseColor(style.color);
    const behind = backgroundOf(element);
    if (
      text &&
      text.a >= 0.5 &&
      behind &&
      luminance(behind) < LIGHT &&
      contrast(text, behind) < DARK_TEXT_CONTRAST
    ) {
      add("dark-text", element, {
        property: "color",
        color: text,
        background: behind,
        area,
      });
    }
  }
}

function* walk(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT);
  for (let node = walker.currentNode; node; node = walker.nextNode()) {
    if (node.nodeType !== Node.ELEMENT_NODE) continue;
    yield node;
    if (node.shadowRoot) yield* walk(node.shadowRoot);
  }
}

// Lists Garmin's own colour variables that are still light after the dark
// theme is applied. Overriding one of them in variables.css fixes every
// feature that uses it.
export function findLightTokens() {
  const names = new Set();
  for (const sheet of document.styleSheets) {
    let rules;
    try {
      rules = sheet.cssRules;
    } catch {
      continue;
    }
    collectCustomProperties(rules, names);
  }

  const rootStyle = getComputedStyle(document.documentElement);
  const tokens = [];
  for (const name of names) {
    const value = rootStyle.getPropertyValue(name).trim();
    const color = parseColor(value);
    if (color && color.a >= 0.5 && luminance(color) >= LIGHT) {
      tokens.push({ name, value: toHex(color) });
    }
  }
  return tokens.sort((a, b) => a.name.localeCompare(b.name));
}

function collectCustomProperties(rules, names) {
  for (const rule of rules) {
    if (rule.cssRules) collectCustomProperties(rule.cssRules, names);
    if (
      !rule.style ||
      !/(:root|html|body|\[data-theme)/.test(rule.selectorText ?? "")
    ) {
      continue;
    }
    for (const property of rule.style) {
      if (property.startsWith("--")) names.add(property);
    }
  }
}

export function scanPage({ root = document.body } = {}) {
  const view = window;
  const backgroundOf = createBackgroundResolver(view);
  const findings = new Map();

  const add = (kind, element, details) => {
    const selector = selectorFor(element);
    const key = `${kind}|${selector}|${toHex(details.color)}`;
    const existing = findings.get(key);
    if (existing) {
      existing.count += 1;
      existing.elements.push(element);
      existing.area = Math.max(existing.area, details.area);
      return;
    }
    findings.set(key, {
      kind,
      selector,
      property: details.property,
      color: toHex(details.color),
      background: details.background ? toHex(details.background) : null,
      area: Math.round(details.area),
      count: 1,
      elements: [element],
    });
  };

  for (const element of walk(root)) {
    if (SKIPPED_TAGS.has(element.tagName) || element.closest(OWN_UI)) continue;
    inspect(element, view, backgroundOf, add);
  }

  return [...findings.values()].sort(
    (a, b) => b.area * b.count - a.area * a.count,
  );
}
