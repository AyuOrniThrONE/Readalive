/***********************
 * STATE
 ***********************/
let isEnabled = false;
let inactivityTimer = null;
let lastActivityTime = Date.now();

// Short threshold for testing (increase later)
const inactivityThreshold = 45000;

/***********************
 * MESSAGE LISTENER
 ***********************/
chrome.runtime.onMessage.addListener((msg) => {
  console.log("ReadAlive message:", msg);

  if (msg.type === "ENABLE") {
    if (isEnabled) return;
    isEnabled = true;
    lastActivityTime = Date.now();
    startInactivityCheck();
  }

  if (msg.type === "DISABLE") {
    if (!isEnabled) return;
    isEnabled = false;
    stopInactivityCheck();
  }
});

/***********************
 * ACTIVITY TRACKING
 ***********************/
function resetActivityTimer() {
  if (!isEnabled) return;
  lastActivityTime = Date.now();
}

["scroll", "mousemove", "keydown"].forEach(evt =>
  window.addEventListener(evt, resetActivityTimer)
);

/***********************
 * INACTIVITY CHECK
 ***********************/
function startInactivityCheck() {
  if (inactivityTimer) return;
const useQuestion = Math.random() < 0.65;
useQuestion ? triggerQuestion() : triggerOverlay();

  console.log("ReadAlive started");

  inactivityTimer = setInterval(() => {
    if (!isEnabled) return;

    if (Date.now() - lastActivityTime > inactivityThreshold) {
      console.log("ReadAlive inactive → overlay");
      triggerOverlay();
      lastActivityTime = Date.now();
    }
  }, 1000);
}

function stopInactivityCheck() {
  if (inactivityTimer) {
    clearInterval(inactivityTimer);
    inactivityTimer = null;
  }
  removeOverlay();
}

/***********************
 * OVERLAY UI
 ***********************/
function triggerOverlay() {
  if (document.getElementById("readalive-overlay")) return;

  const logoUrl = chrome.runtime.getURL("icons/icons48.png");
const headings = extractHeadings(); 
const lastHeading = headings.length ? headings[headings.length - 1] : "SCROLL UP TO SEE";
  const overlay = document.createElement("div");
  overlay.id = "readalive-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  overlay.innerHTML = `
  <div class="readalive-modal">
      <h3>👀 Stay Awake</h3>
      <p>Last topic:<strong> ${lastHeading}</strong></p> 
      <p style="margin-top:10px">Tap all 3 dots</p>

      <div class="dots"> <span class="dot"></span> <span class="dot"></span> <span class="dot"></span> </div>

      <div style="display:flex;align-items:center;justify-content:center;gap:6px;">
        <img src="${logoUrl}" width="20" />
        <strong>ReadAlive</strong>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

 let hitCount = 0; overlay.querySelectorAll(".dot").forEach(dot => { dot.addEventListener("click", () => { if (!dot.classList.contains("active")) { dot.classList.add("active"); hitCount++; } if (hitCount === 3) overlay.remove(); }); });
}

function removeOverlay() {
  const el = document.getElementById("readalive-overlay");
  if (el) el.remove();
}
function extractHeadings() { const headings = []; document.querySelectorAll("h1, h2, h3, h4").forEach(h => { const text = h.innerText.trim(); if (text) headings.push(text); }); return headings; }
function renderOverlay(innerHTML) {
  if (document.getElementById("readalive-overlay")) return;

  const logoUrl = chrome.runtime.getURL("icons/icons48.png");

  const overlay = document.createElement("div");
  overlay.id = "readalive-overlay";
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(0,0,0,0.6);
    z-index: 999999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;

  overlay.innerHTML = `
    <div style="
      background: white;
      padding: 20px;
      border-radius: 12px;
      text-align: center;
      width: 280px;
    ">
      ${innerHTML}

      <div style="margin-top:16px;display:flex;align-items:center;justify-content:center;gap:6px;">
        <img src="${logoUrl}" width="20" />
        <strong>ReadAlive</strong>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}
function triggerQuestion() {
  const headings = extractHeadings();
  if (!headings.length) {
    triggerOverlay(); // fallback
    return;
  }

  const correct = headings[headings.length - 1];
  const options = shuffleArray([
    correct,
    ...shuffleArray(headings).slice(0, 2)
  ]).slice(0, 3);

  renderOverlay(`
    <h3>🤔 Quick Check</h3>
    <p>What were you just reading?</p>

    <div style="margin-top:12px">
      ${options.map(opt => `
        <button class="qa-option"
          style="
            display:block;
            width:100%;
            margin:6px 0;
            padding:8px;
            border-radius:8px;
            border:1px solid #ddd;
            cursor:pointer;
          ">
          ${opt}
        </button>
      `).join("")}
    </div>
  `);

  document.querySelectorAll(".qa-option").forEach(btn => {
    btn.onclick = () => removeOverlay();
  });
}
function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}


