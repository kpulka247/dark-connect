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

export function createModalHTML(version) {
  const listItems = RELEASE_NOTES.map((note) => {
    const details = note.items
      ? `<ul>${note.items.map((item) => `<li>${item}</li>`).join("")}</ul>`
      : `<p>${note.description}</p>`;

    return `<li><b>${note.title}</b>${details}</li>`;
  }).join("");

  return `
    <div id="dc-modal-overlay">
      <div id="dc-modal-content">
        <div class="dc-modal-header">
          <h2>Dark Connect <span class="dc-version">v${version}</span></h2>
          <button id="dc-modal-close">✕</button>
        </div>
        <div class="dc-modal-body">
          <h3>✨ What's New?</h3>
          <ul>${listItems}</ul>
        </div>
        <div class="dc-modal-footer">
          <a href="${CHANGELOG_URL}" target="_blank" class="dc-changelog-btn">Changelog</a>
          <button id="dc-modal-ok-btn">Got it!</button>
        </div>
      </div>
    </div>
  `;
}
