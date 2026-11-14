import { anonymizePage } from "./audit/issue.js";
import { findLightTokens, scanPage } from "./audit/scan.js";
import { createModal } from "./whatsNew.js";

const MAIN_STYLE_ID = "dark-connect-style";
const MAIN_STYLE_URL = chrome.runtime.getURL("styles/main.css");

const MODAL_STYLE_ID = "dark-connect-modal-style";
const MODAL_STYLE_URL = chrome.runtime.getURL("styles/modal.css");

function setStylesheet(id, url, enabled) {
  const existingLink = document.getElementById(id);
  if (!enabled) {
    existingLink?.remove();
    return;
  }
  if (existingLink) return;

  const link = document.createElement("link");
  link.id = id;
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = url;
  document.head.appendChild(link);
}

function updateTheme(themeSetting) {
  let userPrefersDark = true;
  if (themeSetting === "light") {
    userPrefersDark = false;
  } else if (themeSetting === "auto") {
    userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  setStylesheet(MAIN_STYLE_ID, MAIN_STYLE_URL, userPrefersDark);
}

function toggleModalCSS(enable) {
  setStylesheet(MODAL_STYLE_ID, MODAL_STYLE_URL, enable);
}

function showWhatsNewModal(version) {
  if (document.getElementById("dc-modal-overlay")) return;

  toggleModalCSS(true);

  const overlay = createModal(version);
  document.body.append(overlay);

  requestAnimationFrame(() => {
    overlay.classList.add("dc-visible");
  });

  const removeModal = () => {
    overlay.classList.remove("dc-visible");
    setTimeout(() => {
      overlay.remove();
      toggleModalCSS(false);
    }, 300);
  };

  document
    .getElementById("dc-modal-close")
    .addEventListener("click", removeModal);
  document
    .getElementById("dc-modal-ok-btn")
    .addEventListener("click", removeModal);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) removeModal();
  });
}

// --- INITIALIZATION ---
chrome.storage.local.get(
  ["theme", "showUpdateModal", "updateVersion"],
  (result) => {
    updateTheme(result.theme || "dark");

    if (result.showUpdateModal) {
      showWhatsNewModal(
        result.updateVersion || chrome.runtime.getManifest().version,
      );
      chrome.storage.local.set({ showUpdateModal: false });
    }
  },
);

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.theme) {
    updateTheme(changes.theme.newValue);
  }
});

window
  .matchMedia("(prefers-color-scheme: dark)")
  .addEventListener("change", () => {
    chrome.storage.local.get(["theme"], (result) => {
      if (result.theme === "auto") {
        updateTheme("auto");
      }
    });
  });

function withoutElements(findings) {
  return findings.map(({ elements, ...finding }) => finding);
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "dark-connect:scan") return;

  if (!document.getElementById(MAIN_STYLE_ID)) {
    sendResponse({ darkThemeOn: false });
    return;
  }
  sendResponse({
    darkThemeOn: true,
    page: anonymizePage(location.href),
    findings: withoutElements(scanPage()),
  });
});

// For maintainers: in the DevTools console, switch the context from "top" to
// Dark Connect, then run darkConnect.scan() or darkConnect.lightTokens().
globalThis.darkConnect = {
  scan() {
    const findings = scanPage();
    console.table(withoutElements(findings));
    return findings;
  },
  lightTokens() {
    const tokens = findLightTokens();
    console.table(tokens);
    return tokens;
  },
};
