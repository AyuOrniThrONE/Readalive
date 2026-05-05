/***********************
 * STATE
 ***********************/
let isEnabled = false;
let inactivityTimer = null;
let lastActivityTime = Date.now();

// Restore state on reload
chrome.runtime.sendMessage({ type: "GET_STATE" }, (isEnabledState) => {
  if (isEnabledState) {
    isEnabled = true;
    lastActivityTime = Date.now();
    startInactivityCheck();
  }
});

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

  const headings = extractHeadings(); 
  const lastHeading = headings.length ? headings[headings.length - 1] : "SCROLL UP TO SEE";

  renderOverlay(`
      <h3>👀 Stay Awake</h3>
      <p>Last topic:<strong> ${lastHeading}</strong></p> 
      <p style="margin-top:10px">Tap all 3 dots</p>
      <div class="readalive-dots"> <span class="readalive-dot"></span> <span class="readalive-dot"></span> <span class="readalive-dot"></span> </div>
  `);

  let hitCount = 0; 
  document.querySelectorAll("#readalive-overlay .readalive-dot").forEach(dot => { 
    dot.addEventListener("click", () => { 
      if (!dot.classList.contains("active")) { 
        dot.classList.add("active"); 
        hitCount++; 
      } 
      if (hitCount === 3) removeOverlay(); 
    }); 
  });
}

function removeOverlay() {
  const el = document.getElementById("readalive-overlay");
  if (el) el.remove();
}

function extractHeadings() { 
  const headings = []; 
  const meaninglessWords = ["home", "next", "previous", "menu"];
  document.querySelectorAll("h1, h2, h3, h4").forEach(h => { 
    const text = h.innerText.trim(); 
    if (text.length >= 10 && !meaninglessWords.includes(text.toLowerCase())) {
      headings.push(text); 
    }
  }); 
  return headings; 
}

function renderOverlay(innerHTML) {
  if (document.getElementById("readalive-overlay")) return;

  const logoUrl = chrome.runtime.getURL("icons/icons48.png");

  const overlay = document.createElement("div");
  overlay.id = "readalive-overlay";

  overlay.innerHTML = `
    <div class="readalive-modal">
      ${innerHTML}
      <div class="readalive-brand">
        <img src="${logoUrl}" class="readalive-logo" />
        <span class="readalive-text">ReadAlive</span>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
}
function generateOptions(headings) {
  const correct = headings[headings.length - 1];
  const distractorsPool = headings.slice(0, -1);
  const numDistractors = Math.random() < 0.5 ? 2 : 3;
  const distractors = shuffleArray(distractorsPool).slice(0, numDistractors);
  
  const options = shuffleArray([correct, ...distractors]);
  return { correct, options };
}

function triggerQuestion() {
  const headings = extractHeadings();
  if (headings.length < 2) {
    triggerOverlay(); // fallback
    return;
  }

  const { correct, options } = generateOptions(headings);

  renderOverlay(`
    <h3>🤔 Quick Check</h3>
    <p>What were you just reading?</p>

    <div style="margin-top:12px">
      ${options.map(opt => `
        <button class="readalive-qa-option" data-correct="${opt === correct}"
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

  document.querySelectorAll(".readalive-qa-option").forEach(btn => {
    btn.onclick = () => {
      const isCorrect = btn.getAttribute("data-correct") === "true";
      if (isCorrect) {
        btn.style.backgroundColor = "#d4edda";
        btn.innerText += " ✅";
      } else {
        btn.style.backgroundColor = "#f8d7da";
        btn.innerText += " ❌";
      }
      setTimeout(removeOverlay, 800);
    };
  });
}

function shuffleArray(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}


