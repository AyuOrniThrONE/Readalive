let lastActivityTime = Date.now();
let inactivityThreshold = 45000; // default medium
let inactivityTimer = null;

let sessionStartTime = Date.now();
let totalActiveTime = 0;

// Load sensitivity
chrome.storage.sync.get(["sensitivity"], (result) => {
  if (result.sensitivity === "high") inactivityThreshold = 30000;
  if (result.sensitivity === "low") inactivityThreshold = 60000;
});

// Activity detection
function resetActivityTimer() {
  lastActivityTime = Date.now();
}

["scroll", "mousemove", "keydown"].forEach(evt =>
  window.addEventListener(evt, resetActivityTimer)
);

// Extract headings safely
function extractHeadings() {
  const headings = [];
  document.querySelectorAll("h1, h2, h3, h4").forEach(h => {
    const text = h.innerText.trim();
    if (text) headings.push(text);
  });
  return headings;
}

// End study session
function endSession() {
  totalActiveTime += Date.now() - sessionStartTime;

  chrome.storage.sync.set({
    lastSessionTime: totalActiveTime
  });

  sessionStartTime = Date.now();
}

// Inactivity watcher
function startInactivityCheck() {
  inactivityTimer = setInterval(() => {
    if (Date.now() - lastActivityTime > inactivityThreshold) {
      endSession();
      triggerIntervention();
      lastActivityTime = Date.now();
    }
  }, 5000);
}

// UI Intervention
function triggerIntervention() {
  if (document.getElementById("readalive-overlay")) return;

  const headings = extractHeadings();
  const lastHeading = headings.length
    ? headings[headings.length - 1]
    : "SCROLL UP TO SEE";

  const overlay = document.createElement("div");
  overlay.id = "readalive-overlay";
  const logoUrl = chrome.runtime.getURL("icons/icons48.png");

  overlay.innerHTML = `
    <div class="readalive-modal">
      <h2>👀 Stay Awake</h2>
      <p>Last topic:<strong> ${lastHeading}</strong></p>
      <p style="margin-top:10px">Tap all 3 dots to continue</p>
      <div class="dots">
        <span class="dot"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>
    <img src="${logoUrl}" class="readalive-logo" />
  <span class="readalive-text">ReadAlive</span>
    </div>
  `;

  document.body.appendChild(overlay);

  let hitCount = 0;
  overlay.querySelectorAll(".dot").forEach(dot => {
    dot.addEventListener("click", () => {
      if (!dot.classList.contains("active")) {
        dot.classList.add("active");
        hitCount++;
      }
      if (hitCount === 3) overlay.remove();
    });
  });

  setTimeout(() => overlay.remove(), 15000);
}

startInactivityCheck();
