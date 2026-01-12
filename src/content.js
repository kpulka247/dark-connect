import { createModalHTML } from "./whatsNew";

const MAIN_STYLE_ID = "dark-connect-style";
const MAIN_STYLE_URL = chrome.runtime.getURL("styles/main.css");

const MODAL_STYLE_ID = "dark-connect-modal-style";
const MODAL_STYLE_URL = chrome.runtime.getURL("styles/modal.css");

function updateTheme(themeSetting) {
  const existingLink = document.getElementById(MAIN_STYLE_ID);

  let userPrefersDark = true;

  if (themeSetting === "light") {
    userPrefersDark = false;
  } else if (themeSetting === "auto") {
    userPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  }

  if (userPrefersDark) {
    if (!existingLink) {
      const link = document.createElement("link");
      link.id = MAIN_STYLE_ID;
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = MAIN_STYLE_URL;
      document.head.appendChild(link);
    }
  } else {
    if (existingLink) {
      existingLink.remove();
    }
  }
}

function toggleModalCSS(enable) {
  const existingLink = document.getElementById(MODAL_STYLE_ID);
  if (enable) {
    if (!existingLink) {
      const link = document.createElement("link");
      link.id = MODAL_STYLE_ID;
      link.rel = "stylesheet";
      link.type = "text/css";
      link.href = MODAL_STYLE_URL;
      document.head.appendChild(link);
    }
  } else {
    if (existingLink) {
      existingLink.remove();
    }
  }
}

function showWhatsNewModal(version) {
  if (document.getElementById("dc-modal-overlay")) return;

  toggleModalCSS(true);

  const modalHTML = createModalHTML(version);
  document.body.insertAdjacentHTML("beforeend", modalHTML);

  const overlay = document.getElementById("dc-modal-overlay");

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
        result.updateVersion || chrome.runtime.getManifest().version
      );
      chrome.storage.local.set({ showUpdateModal: false });
    }
  }
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
