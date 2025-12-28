document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const key = `readalive_${tab.id}`;

  const toggle = document.getElementById("toggle");

  const result = await chrome.storage.session.get(key);
  toggle.checked = result[key] === true;

  toggle.addEventListener("change", async () => {
    await chrome.storage.session.set({ [key]: toggle.checked });

    chrome.tabs.sendMessage(tab.id, {
      type: toggle.checked ? "ENABLE" : "DISABLE"
    });
  });
});
chrome.tabs.sendMessage(tab.id, { type: "ENABLE" });
