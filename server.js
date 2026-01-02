const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ===== IST TIME ===== */
function IST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* ===== 5:30 AM RESET BASE ===== */
function getBaseTime() {
  const now = IST();
  const base = new Date(now);
  if (now.getHours() < 5 || (now.getHours() === 5 && now.getMinutes() < 30)) {
    base.setDate(base.getDate() - 1);
  }
  base.setHours(5, 30, 0, 0);
  return base;
}

/* ===== UPCOMING PERIOD (TIME X → RESULT X+1) ===== */
function getResultPeriod() {
  const base = getBaseTime();
  const now = IST();
  const diffMin = Math.floor((now - base) / 60000);
  const round = diffMin + 2; // running minute + 1 (upcoming)

  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");
  return ymd + "10001" + String(round).padStart(4, "0");
}

/* ===== PURE PRNG ===== */
function rng() {
  return Math.floor(Math.random() * 10); // 0–9 natural
}

function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

function colorOf(n) {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

/* ===== STATE ===== */
let preview = null;
let history = [];
let lastLockedPeriod = null;

/* ===== MAIN TIMER ===== */
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();
  const period = getResultPeriod();

  // 30 sec → PREVIEW
  if (sec === 30 && preview === null) {
    preview = rng();
  }

  // 59 sec → FINAL LOCK
  if (sec === 59 && preview !== null && lastLockedPeriod !== period) {
    history.unshift({
      period,
      number: preview,
      size: bigSmall(preview),
      color: colorOf(preview),
    });

    history = history.slice(0, 10);
    lastLockedPeriod = period;
    preview = null;
  }
}, 1000);

/* ===== API ===== */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();

  res.json({
    period: getResultPeriod(),
    time: now.toLocaleString(),
    timeRemaining: 59 - sec,
    result: sec >= 30 ? preview : null,
    history,
  });
});

app.listen(PORT, () => {
  console.log("Server running");
});
