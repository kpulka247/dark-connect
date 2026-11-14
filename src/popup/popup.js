import { buildIssueUrl } from "../audit/issue.js";
import { KOFI_URL, createCoffeeIcon } from "../ui/coffee.js";

const THEME_HINTS = {
  auto: "Follows your device: dark when your system is dark.",
  dark: "Garmin Connect is always dark.",
  light: "Dark Connect is paused. Garmin Connect looks as usual.",
};

function browserName() {
  const agent = navigator.userAgent;
  if (agent.includes("Firefox/")) return "Firefox";
  if (agent.includes("Edg/")) return "Edge";
  return "Chrome";
}

function scanActiveTab() {
  return new Promise((resolve) => {
    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id) {
        resolve(null);
        return;
      }
      chrome.tabs.sendMessage(
        tab.id,
        { type: "dark-connect:scan" },
        (reply) => {
          // No content script on this tab, so it is not a supported Garmin page.
          resolve(chrome.runtime.lastError ? null : reply);
        },
      );
    });
  });
}

async function reportPage(button, status) {
  button.disabled = true;
  status.textContent = "Scanning…";

  const result = await scanActiveTab();
  button.disabled = false;

  if (!result) {
    status.textContent =
      "This isn't a Garmin Connect page. Open the page with the problem and try again. If it is open, reload it first.";
    return;
  }
  if (!result.darkThemeOn) {
    status.textContent = "Choose Dark above, then scan again.";
    return;
  }

  const url = buildIssueUrl({
    page: result.page,
    findings: result.findings,
    version: chrome.runtime.getManifest().version,
    browser: browserName(),
  });
  chrome.tabs.create({ url });
  window.close();
}

document.addEventListener("DOMContentLoaded", () => {
  const radios = document.querySelectorAll('input[name="theme"]');

  const hint = document.getElementById("theme-hint");
  const showTheme = (theme) => {
    const radio = document.getElementById(`theme-${theme}`);
    if (radio) radio.checked = true;
    hint.textContent = THEME_HINTS[theme] ?? "";
  };

  chrome.storage.local.get(["theme"], (result) => {
    showTheme(result.theme || "dark");
  });

  radios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.checked) {
        showTheme(event.target.value);
        chrome.storage.local.set({ theme: event.target.value });
      }
    });
  });

  document.getElementById("version").textContent =
    `v${chrome.runtime.getManifest().version}`;

  const coffee = document.getElementById("coffee");
  coffee.href = KOFI_URL;
  coffee.prepend(createCoffeeIcon());

  const button = document.getElementById("report-page");
  const status = document.getElementById("report-status");
  button.addEventListener("click", () => reportPage(button, status));
});
