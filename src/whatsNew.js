export const RELEASE_NOTES = [
  "🌟 <b>Join Our Community!</b> We welcome contributors to help us fix bugs and build features. Found a bug or have an idea? Open an issue! If you want to contribute code, please read our CONTRIBUTING guidelines on GitHub to learn how to get started. ❤️",
  "🐛 <b>Bug Fixes:</b> Fixed carousel card shadow, workout list icons, and challenge comment title colors.",
];

export const CHANGELOG_URL =
  "https://github.com/kpulka247/dark-connect/blob/main/CHANGELOG.md";

export function createModalHTML(version) {
  const listItems = RELEASE_NOTES.map((note) => `<li>${note}</li>`).join("");

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
