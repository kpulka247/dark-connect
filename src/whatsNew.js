export const RELEASE_NOTES = [
  {
    title: "🐛 Bug Fixes",
    items: [
      "Fixed event name text color on event details pages.",
      "Fixed coach plan timeline cards that were missing dark mode styling.",
      "Fixed gear default activities selection readability.",
      "Fixed strength training exercise picker readability.",
      "Fixed course planning controls, legends, point cards and sheet styling.",
      "Fixed report table date links color.",
      "Fixed inline edit hover color and activity edit icon color.",
      "Fixed active photo carousel indicator color.",
      "Fixed segments map/list toggle background color.",
      "Fixed follower share profile dropdown styling.",
      "Fixed shared plan review card section text color.",
    ],
  },
  {
    title: "🌟 Join Our Community!",
    description:
      "We welcome contributors to help us fix bugs and build features. Found a bug or have an idea? Open an issue! If you want to contribute code, please read our CONTRIBUTING guidelines on GitHub to learn how to get started. ❤️",
  },
];

export const CHANGELOG_URL =
  "https://github.com/kpulka247/dark-connect/blob/main/CHANGELOG.md";

function element(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  node.append(...children);
  return node;
}

// Built with DOM calls instead of an HTML string, so release notes are always
// inserted as text.
export function createModal(version) {
  const notes = RELEASE_NOTES.map((note) =>
    element(
      "li",
      {},
      element("b", {}, note.title),
      note.items
        ? element(
            "ul",
            {},
            ...note.items.map((item) => element("li", {}, item)),
          )
        : element("p", {}, note.description),
    ),
  );

  return element(
    "div",
    { id: "dc-modal-overlay" },
    element(
      "div",
      { id: "dc-modal-content" },
      element(
        "div",
        { className: "dc-modal-header" },
        element(
          "h2",
          {},
          "Dark Connect ",
          element("span", { className: "dc-version" }, `v${version}`),
        ),
        element("button", { id: "dc-modal-close" }, "✕"),
      ),
      element(
        "div",
        { className: "dc-modal-body" },
        element("h3", {}, "✨ What's New?"),
        element("ul", {}, ...notes),
      ),
      element(
        "div",
        { className: "dc-modal-footer" },
        element(
          "a",
          {
            href: CHANGELOG_URL,
            target: "_blank",
            className: "dc-changelog-btn",
          },
          "Changelog",
        ),
        element("button", { id: "dc-modal-ok-btn" }, "Got it!"),
      ),
    ),
  );
}
