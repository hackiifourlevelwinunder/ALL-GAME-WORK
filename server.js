// server.js
const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

/* ===================== TIME & PERIOD ===================== */

const RESET_HOUR = 5;
const RESET_MIN = 30;
const PERIOD_PREFIX = "10001";

function getIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function getGameDate(d) {
  const reset = new Date(d);
  reset.setHours(RESET_HOUR, RESET_MIN, 0, 0);
  if (d < reset) d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

function getPeriodInfo() {
  const now = getIST();
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();

  const gameDate = getGameDate(new Date(now));
  const baseIndex = minutes + 1; // +1 PERIOD LOGIC

  const period = `${gameDate}${PERIOD_PREFIX}${String(baseIndex).padStart(3, "0")}`;
  const preview = seconds >= 30 && seconds < 59;
  const locked = seconds >= 59;

  return {
    now,
    seconds,
    preview,
    locked,
    period
  };
}

/* ===================== RNG ENGINE ===================== */

function serverRNG() {
  // Natural 50-50 feel (no bias, no loop forcing)
  const seed =
    Date.now() ^
    Math.floor(Math.random() * 1e9) ^
    process.memoryUsage().heapUsed;

  return seed % 10;
}

function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

function colour(n) {
  if (n === 0 || n === 5) return "Violet";
  return n % 2 === 0 ? "Red" : "Green";
}

/* ===================== STATE ===================== */

let current = null;
let history = [];
let lastFinalPeriod = null;

/* ===================== CORE LOOP ===================== */

setInterval(() => {
  const info = getPeriodInfo();

  // PREVIEW (30s)
  if (info.preview && (!current || current.period !== info.period)) {
    const num = serverRNG();
    current = {
      period: info.period,
      number: num,
      bigSmall: bigSmall(num),
      colour: colour(num),
      final: false
    };
  }

  // FINAL (59s)
  if (info.locked && lastFinalPeriod !== info.period) {
    if (!current || current.period !== info.period) {
      const num = serverRNG();
      current = {
        period: info.period,
        number: num,
        bigSmall: bigSmall(num),
        colour: colour(num),
        final: true
      };
    } else {
      current.final = true;
    }

    history.unshift({
      period: current.period,
      number: current.number,
      bigSmall: current.bigSmall,
      colour: current.colour
    });

    if (history.length > 50) history.length = 50;

    lastFinalPeriod = info.period;
  }
}, 1000);

/* ===================== API ===================== */

app.get("/api/status", (req, res) => {
  const info = getPeriodInfo();
  res.json({
    time: info.now,
    timeRemaining: 60 - info.seconds,
    period: info.period,
    result: current && current.period === info.period ? current.number : null,
    history
  });
});

/* ===================== START ===================== */

app.listen(PORT, () => {
  console.log("Server running on", PORT);
});
