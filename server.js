const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static("public"));

/* ================= TIME (IST) ================= */
function IST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* ================= DAY RESET (5:30 AM) ================= */
function getDayBase(now) {
  const base = new Date(now);
  base.setHours(5, 30, 0, 0);
  if (now < base) base.setDate(base.getDate() - 1);
  return base;
}

/* ================= PERIOD CALCULATION =================
   Period kabhi future ka nahi hoga
   Time 11:43 → period 74
*/
function getCurrentPeriod() {
  const now = IST();
  const base = getDayBase(now);

  const diffMin = Math.floor((now - base) / 60000); // no +1
  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");

  return `${ymd}10001${String(diffMin).padStart(4, "0")}`;
}

/* ================= PURE RNG (50–50) ================= */
function rng() {
  return Math.floor(Math.random() * 10); // 0–9 pure random
}

function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

function colorOf(n) {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
}

/* ================= GAME STATE ================= */
let previewNumber = null;
let history = [];
let lastLockedPeriod = null;

/* ================= MAIN TIMER =================
   00–29 sec → blank
   30 sec    → preview
   59 sec    → final + history
*/
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();
  const period = getCurrentPeriod();

  // 30 second preview
  if (sec === 30 && previewNumber === null) {
    previewNumber = rng();
  }

  // 59 second final lock
  if (sec === 59 && previewNumber !== null && lastLockedPeriod !== period) {
    history.unshift({
      period,
      number: previewNumber,
      size: bigSmall(previewNumber),
      color: colorOf(previewNumber),
      time: now.toLocaleString(),
    });

    history = history.slice(0, 10);
    lastLockedPeriod = period;
    previewNumber = null;
  }
}, 1000);

/* ================= API ================= */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();

  res.json({
    time: now.toLocaleString(),
    period: getCurrentPeriod(),
    timeRemaining: 59 - sec,
    result: sec >= 30 ? previewNumber : null,
    history,
  });
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING (FINAL LOGIC)");
});
