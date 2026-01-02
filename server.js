const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= TIME HELPERS ================= */
function IST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

// 5:30 AM reset base
function getBaseTime() {
  const now = IST();
  const base = new Date(now);
  if (
    now.getHours() < 5 ||
    (now.getHours() === 5 && now.getMinutes() < 30)
  ) {
    base.setDate(base.getDate() - 1);
  }
  base.setHours(5, 30, 0, 0);
  return base;
}

// CURRENT period only (NO +1 here)
function getCurrentPeriod() {
  const base = getBaseTime();
  const now = IST();
  const diffMin = Math.floor((now - base) / 60000);
  const round = diffMin + 1;

  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");
  return ymd + "10001" + String(round).padStart(4, "0");
}

/* ================= GAME LOGIC ================= */
let previewResult = null; // 30–59 sec
let lockedHistory = [];   // only locked rounds
let lastLockedPeriod = null;

function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

function colorOf(n) {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

// server-side RNG (50–50 natural)
function generateNumber() {
  return Math.floor(Math.random() * 10);
}

// MAIN TIMER
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();
  const currentPeriod = getCurrentPeriod();

  // 30 sec preview (ONCE per round)
  if (sec === 30 && previewResult === null) {
    previewResult = generateNumber();
  }

  // 00 sec FINAL LOCK
  if (sec === 0 && previewResult !== null) {
    if (lastLockedPeriod !== currentPeriod) {
      lockedHistory.unshift({
        period: currentPeriod,
        number: previewResult,
        size: bigSmall(previewResult),
        color: colorOf(previewResult),
      });

      lockedHistory = lockedHistory.slice(0, 10);
      lastLockedPeriod = currentPeriod;
    }
    previewResult = null;
  }
}, 1000);

/* ================= API ================= */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();

  res.json({
    period: getCurrentPeriod(),        // ONLY current period
    time: now.toLocaleString(),
    timeRemaining: 59 - sec,
    result: sec >= 30 ? previewResult : null, // preview only after 30s
    history: lockedHistory,             // ONLY locked history
  });
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
