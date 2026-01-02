const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ============ IST TIME ============ */
function IST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* ============ DAY RESET 5:30 AM ============ */
function getDayBase(now) {
  const base = new Date(now);
  base.setHours(5, 30, 0, 0);
  if (now < base) base.setDate(base.getDate() - 1);
  return base;
}

/* ============ PERIOD LOGIC (FIXED) ============
   Current time chal raha ho → NEXT minute ka period
*/
function getLivePeriod() {
  const now = IST();
  const base = getDayBase(now);

  // +1 IMPORTANT (upcoming minute)
  const diffMin = Math.floor((now - base) / 60000) + 1;

  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");
  return `${ymd}10001${String(diffMin).padStart(4, "0")}`;
}

/* ============ PURE RNG (50-50) ============ */
function rng() {
  return Math.floor(Math.random() * 10); // 0–9
}

function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

function colorOf(n) {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

/* ============ GAME STATE ============ */
let preview = null;
let history = [];
let lockedPeriod = null;

/* ============ TIMER ENGINE ============ */
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();

  const livePeriod = getLivePeriod();
  const previousPeriod = String(Number(livePeriod) - 1);

  // 30 sec → preview (previous period ka)
  if (sec === 30 && preview === null) {
    preview = rng();
  }

  // 59 sec → final lock + history
  if (sec === 59 && preview !== null && lockedPeriod !== previousPeriod) {
    history.unshift({
      period: previousPeriod,
      number: preview,
      size: bigSmall(preview),
      color: colorOf(preview),
      time: now.toLocaleString(),
    });

    history = history.slice(0, 10);
    lockedPeriod = previousPeriod;
    preview = null;
  }
}, 1000);

/* ============ API ============ */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();

  res.json({
    time: now.toLocaleString(),
    livePeriod: getLivePeriod(),          // upcoming
    remaining: 59 - sec,
    result: sec >= 30 ? preview : null,   // preview
    history,
  });
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING (PERIOD FIXED)");
});
