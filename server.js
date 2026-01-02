const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

function IST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

// ===== PERIOD BASE (5:30 AM RESET) =====
function getBaseTime() {
  const now = IST();
  const base = new Date(now);
  if (now.getHours() < 5 || (now.getHours() === 5 && now.getMinutes() < 30)) {
    base.setDate(base.getDate() - 1);
  }
  base.setHours(5, 30, 0, 0);
  return base;
}

// ===== CURRENT TIME PERIOD (X) =====
function getCurrentPeriodNumber() {
  const base = getBaseTime();
  const now = IST();
  return Math.floor((now - base) / 60000) + 1;
}

// ===== UPCOMING RESULT PERIOD (X+1) =====
function getResultPeriod() {
  const base = getBaseTime();
  const round = getCurrentPeriodNumber() + 1;
  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");
  return ymd + "10001" + String(round).padStart(4, "0");
}

// ===== RNG =====
function rng() {
  return Math.floor(Math.random() * 10);
}
function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}
function colorOf(n) {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

let preview = null;
let history = [];
let lastLockedPeriod = null;

// ===== MAIN TIMER =====
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();
  const resultPeriod = getResultPeriod();

  // 01:31:30 → PREVIEW
  if (sec === 30 && preview === null) {
    preview = rng();
  }

  // 01:31:59 → FINAL LOCK + HISTORY
  if (sec === 59 && preview !== null && lastLockedPeriod !== resultPeriod) {
    history.unshift({
      period: resultPeriod,
      number: preview,
      size: bigSmall(preview),
      color: colorOf(preview),
    });
    history = history.slice(0, 10);
    lastLockedPeriod = resultPeriod;
    preview = null;
  }
}, 1000);

// ===== API =====
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();

  res.json({
    period: getResultPeriod(),          // always upcoming (02)
    time: now.toLocaleString(),
    result: sec >= 30 ? preview : null, // preview from 30s
    history: history,                  // only locked
  });
});

app.listen(PORT, () => {
  console.log("Server running");
});
