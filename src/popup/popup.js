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
});
