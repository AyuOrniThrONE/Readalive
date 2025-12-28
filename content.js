let lastActivityTime = Date.now();
let inactivityTimer = null;

// Default sensitivity (ms)
let inactivityThreshold = 45000; // Medium

// Load user settings
chrome.storage.sync.get(["sensitivity"], (result) => {
  if (result.sensitivity === "high") inactivityThreshold = 30000;
  if (result.sensitivity === "low") inactivityThreshold = 60000;
});

// Activity Listeners
function resetActivityTimer() {
  lastActivityTime = Date.now();
}

window.addEventListener("scroll", resetActivityTimer);
window.addEventListener("mousemove", resetActivityTimer);
window.addEventListener("keydown", resetActivityTimer);

// Inactivity Check
function startInactivityCheck() {
  inactivityTimer = setInterval(() => {
    const now = Date.now();
    if (now - lastActivityTime > inactivityThreshold) {
      triggerIntervention();
      lastActivityTime = Date.now(); // prevent loop
    }
  }, 5000);
}

// Placeholder Intervention
function triggerIntervention() {
  if (document.getElementById("readalive-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "readalive-overlay";

  overlay.innerHTML = `
    <div class="readalive-modal">
      <h2>👀 Stay Awake!</h2>
      <p>Tap all 3 dots to continue reading</p>
      <div class="dots">
        <span class="dot" data-hit="false"></span>
        <span class="dot" data-hit="false"></span>
        <span class="dot" data-hit="false"></span>
      </div>
      <small>ReadAlive</small>
    </div>
  `;

  document.body.appendChild(overlay);

  let hitCount = 0;
  const dots = overlay.querySelectorAll(".dot");

  dots.forEach(dot => {
    dot.addEventListener("click", () => {
      if (dot.dataset.hit === "false") {
        dot.dataset.hit = "true";
        dot.classList.add("active");
        hitCount++;
      }

      if (hitCount === 3) {
        closeOverlay();
      }
    });
  });

  setTimeout(closeOverlay, 15000); // Auto-dismiss safety
}
startInactivityCheck();

function closeOverlay() {
  const overlay = document.getElementById("readalive-overlay");
  if (overlay) overlay.remove();
}


document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    clearInterval(inactivityTimer);
  } else {
    startInactivityCheck();
  }
});

