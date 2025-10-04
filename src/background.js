chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === "update") {
    const version = chrome.runtime.getManifest().version;

    chrome.notifications.create({
      type: "basic",
      iconUrl: "icons/icon128.png",
      title: "Dark Connect",
      message: `Updated to version ${version}. Click here to see what's new! 🌙🏃‍♂️✨`,
      priority: 2,
    });
  }
});

chrome.notifications.onClicked.addListener(() => {
  chrome.tabs.create({
    url: "https://github.com/kpulka247/dark-connect/blob/main/CHANGELOG.md",
  });
});
