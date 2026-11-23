import { KOFI_URL, createCoffeeIcon } from "./ui/coffee.js";

export const RELEASE_NOTES = [
  {
    title: "New",
    items: ["Dark Connect now works in Firefox for Android."],
  },
  {
    title: "Fixed",
    items: [
      "The average value on activity charts, such as heart rate and respiration rate, is easy to read again. It no longer sits on a light grey box.",
      "Chart labels on activities are sharp white with a dark outline, instead of a white glow that made them look bold.",
      "The activity map no longer has a light border.",
    ],
  },
];

export const TIP =
  "Spot something still white? Open that page, click the Dark Connect icon in your browser toolbar and press Scan this page.";

export const CHANGELOG_URL =
  "https://github.com/kpulka247/dark-connect/releases";

function element(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (key === "role" || key.startsWith("aria-"))
      node.setAttribute(key, value);
    else node[key] = value;
  }
  node.append(...children);
  return node;
}

// Built with DOM calls instead of an HTML string, so release notes are always
// inserted as text.
export function createModal(version) {
  const sections = RELEASE_NOTES.map((note) =>
    element(
      "section",
      { className: "dc-section" },
      element("h3", {}, note.title),
      element("ul", {}, ...note.items.map((item) => element("li", {}, item))),
    ),
  );

  const coffee = element(
    "a",
    { className: "dc-coffee", href: KOFI_URL, target: "_blank" },
    "Buy me a coffee",
  );
  coffee.prepend(createCoffeeIcon());

  const logo = element("img", {
    className: "dc-logo",
    src: chrome.runtime.getURL("icons/icon48.png"),
    alt: "",
  });

  return element(
    "div",
    { id: "dc-modal-overlay" },
    element(
      "div",
      {
        id: "dc-modal-content",
        role: "dialog",
        "aria-modal": "true",
        "aria-label": "What's new in Dark Connect",
      },
      element(
        "div",
        { className: "dc-modal-header" },
        logo,
        element(
          "div",
          { className: "dc-heading" },
          element("h2", {}, "What's new"),
          element(
            "span",
            { className: "dc-version" },
            `Dark Connect v${version}`,
          ),
        ),
        element("button", { id: "dc-modal-close", "aria-label": "Close" }, "×"),
      ),
      element(
        "div",
        { className: "dc-modal-body" },
        ...sections,
        element("p", { className: "dc-tip" }, TIP),
      ),
      element(
        "div",
        { className: "dc-modal-footer" },
        coffee,
        element(
          "div",
          { className: "dc-actions" },
          element(
            "a",
            {
              className: "dc-changelog-btn",
              href: CHANGELOG_URL,
              target: "_blank",
            },
            "All changes",
          ),
          element("button", { id: "dc-modal-ok-btn" }, "Got it"),
        ),
      ),
    ),
  );
}
