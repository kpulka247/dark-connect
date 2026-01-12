export const RELEASE_NOTES = [
  "<b>New Theme Switcher:</b> You can now control the theme manually! Click the extension icon to choose:",
  "⚙️ <b>Auto:</b> Follows your system/browser preferences.",
  "🌑 <b>Dark:</b> Forces Dark Mode always (Default).",
  "☀️ <b>Light:</b> Disables Dark Mode for Garmin Connect.",
  "<b>Default Settings:</b> Dark Connect now enables Dark Mode by default upon installation.",
  "<b>Bug Fixes:</b> Improved performance and minor style adjustments.",
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
