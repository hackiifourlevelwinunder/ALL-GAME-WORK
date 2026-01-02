const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ========= IST TIME ========= */
function IST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* ========= DAY RESET 5:30 AM ========= */
function getDayBase(now) {
  const base = new Date(now);
  base.setHours(5, 30, 0, 0);
  if (now < base) base.setDate(base.getDate() - 1);
  return base;
}

/* ========= MINUTE INDEX (SOURCE OF TRUTH) ========= */
function getMinuteIndex() {
  const now = IST();
  const base = getDayBase(now);
  return Math.floor((now - base) / 60000) + 1; // UPCOMING minute
}

/* ========= PERIOD FROM INDEX ========= */
function getLivePeriod() {
  const now = IST();
  const base = getDayBase(now);
  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");
  const idx = getMinuteIndex();
  return `${ymd}10001${String(idx).padStart(4, "0")}`;
}

/* ========= STABLE RNG (PER MINUTE) ========= */
function rngForMinute(minuteIndex) {
  // deterministic per minute, still looks random
  let x = (minuteIndex * 9301 + 49297) % 233280;
  return Math.floor((x / 233280) * 10); // 0–9
}

function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

function colorOf(n) {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

/* ========= GAME STATE ========= */
let history = [];
let lastFinalizedIndex = null;

/* ========= ENGINE (MINUTE-BASED, NO SKIP) ========= */
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();

  const liveIndex = getMinuteIndex();      // upcoming
  const prevIndex = liveIndex - 1;         // previous minute

  // Finalize previous minute ONCE when minute index advances
  if (lastFinalizedIndex !== prevIndex && prevIndex > 0) {
    const finalNumber = rngForMinute(prevIndex);

    history.unshift({
      period: String(Number(getLivePeriod()) - 1),
      number: finalNumber,
      size: bigSmall(finalNumber),
      color: colorOf(finalNumber),
      time: now.toLocaleString(),
    });

    history = history.slice(0, 10);
    lastFinalizedIndex = prevIndex;
  }
}, 500); // faster tick to catch minute change reliably

/* ========= API ========= */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();
  const liveIndex = getMinuteIndex();
  const livePeriod = getLivePeriod();

  // Preview after 30 sec of the CURRENT minute (for upcoming period)
  const preview =
    sec >= 30 ? rngForMinute(liveIndex) : null;

  res.json({
    time: now.toLocaleString(),
    period: livePeriod,        // frontend safe
    livePeriod: livePeriod,    // backup
    remaining: 59 - sec,
    result: preview,           // preview number
    history,
  });
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING — FINAL STABLE VERSION");
});
