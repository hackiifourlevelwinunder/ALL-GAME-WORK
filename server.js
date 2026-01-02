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

/* ===== DAY RESET 5:30 AM ===== */
function getDayBase(now) {
  const base = new Date(now);
  base.setHours(5, 30, 0, 0);
  if (now < base) base.setDate(base.getDate() - 1);
  return base;
}

/* ===== PERIOD (UPCOMING MINUTE) ===== */
function getLivePeriod() {
  const now = IST();
  const base = getDayBase(now);

  // +1 minute ALWAYS
  const diffMin = Math.floor((now - base) / 60000) + 1;
  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");

  return `${ymd}10001${String(diffMin).padStart(4, "0")}`;
}

/* ===== PURE RNG ===== */
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

/* ===== GAME STATE ===== */
let preview = null;
let history = [];
let lastLocked = null;

/* ===== TIMER ENGINE ===== */
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();

  const livePeriod = getLivePeriod();
  const previousPeriod = String(Number(livePeriod) - 1);

  // 30 sec preview
  if (sec === 30 && preview === null) {
    preview = rng();
  }

  // 59 sec final
  if (sec === 59 && preview !== null && lastLocked !== previousPeriod) {
    history.unshift({
      period: previousPeriod,
      number: preview,
      size: bigSmall(preview),
      color: colorOf(preview),
      time: now.toLocaleString(),
    });

    history = history.slice(0, 10);
    lastLocked = previousPeriod;
    preview = null;
  }
}, 1000);

/* ===== API (BACKWARD SAFE) ===== */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();
  const livePeriod = getLivePeriod();

  res.json({
    time: now.toLocaleString(),

    // IMPORTANT: dono keys bhej rahe
    period: livePeriod,
    livePeriod: livePeriod,

    remaining: 59 - sec,
    result: sec >= 30 ? preview : null,
    history,
  });
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING — FINAL LOGIC");
});
