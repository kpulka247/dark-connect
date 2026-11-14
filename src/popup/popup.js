import { buildIssueUrl } from "../audit/issue.js";

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
      "Open a Garmin Connect page first, or reload the page if it was open before the extension updated.";
    return;
  }
  if (!result.darkThemeOn) {
    status.textContent = "Switch the theme to Dark, then scan again.";
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

  chrome.storage.local.get(["theme"], (result) => {
    const currentTheme = result.theme || "dark";
    const radioToCheck = document.getElementById(`theme-${currentTheme}`);
    if (radioToCheck) {
      radioToCheck.checked = true;
    }
  });

  radios.forEach((radio) => {
    radio.addEventListener("change", (event) => {
      if (event.target.checked) {
        const selectedTheme = event.target.value;
        chrome.storage.local.set({ theme: selectedTheme });
      }
    });
  });

  const button = document.getElementById("report-page");
  const status = document.getElementById("report-status");
  button.addEventListener("click", () => reportPage(button, status));
});
