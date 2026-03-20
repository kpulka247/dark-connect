export const RELEASE_NOTES = [
  "<b>Bug Fixes:</b> Fixed golf score card and nutrition food title color.",
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
