document.addEventListener("DOMContentLoaded", () => {
  chrome.storage.sync.get(["lastSessionTime"], (data) => {
    const minutes = Math.round((data.lastSessionTime || 0) / 60000);
    document.getElementById("stats").innerText =
      `Last session: ${minutes} min`;
  });
});
