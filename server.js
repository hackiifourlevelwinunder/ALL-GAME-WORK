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

/* ===== RESET 5:30 AM ===== */
function getBase(now) {
  const b = new Date(now);
  b.setHours(5, 30, 0, 0);
  if (now < b) b.setDate(b.getDate() - 1);
  return b;
}

/* ===== MINUTE INDEX ===== */
function minuteIndex() {
  const now = IST();
  const base = getBase(now);
  return Math.floor((now - base) / 60000) + 1; // UPCOMING
}

/* ===== PERIOD ===== */
function periodFromIndex(idx) {
  const base = getBase(IST());
  const ymd = base.toISOString().slice(0, 10).replace(/-/g, "");
  return `${ymd}10001${String(idx).padStart(4, "0")}`;
}

/* ===== COLOR / SIZE ===== */
const sizeOf = n => (n >= 5 ? "Big" : "Small");
const colorOf = n => {
  if (n === 0 || n === 5) return "Violet";
  if ([1, 3, 7, 9].includes(n)) return "Green";
  return "Red";
};

/* ===== SERVER STATE ===== */
let history = [];
let finalized = new Set();
let frequencyPool = {}; // per minute

/* ===== RNG HIT (REAL FEEL) ===== */
function hitRNG() {
  const n = Math.floor(Math.random() * 10);
  frequencyPool[n] = (frequencyPool[n] || 0) + 1;
  return n;
}

/* ===== ENGINE ===== */
setInterval(() => {
  const now = IST();
  const sec = now.getSeconds();
  const liveIdx = minuteIndex();
  const prevIdx = liveIdx - 1;

  // simulate server activity (world hits)
  hitRNG();

  // FINALIZE PREVIOUS MINUTE (ONLY ONCE)
  if (!finalized.has(prevIdx) && prevIdx > 0 && sec === 0) {
    finalized.add(prevIdx);

    // pick highest frequency number
    let finalNum = 0;
    let max = -1;
    for (const n in frequencyPool) {
      if (frequencyPool[n] > max) {
        max = frequencyPool[n];
        finalNum = Number(n);
      }
    }

    history.unshift({
      period: periodFromIndex(prevIdx),
      number: finalNum,
      size: sizeOf(finalNum),
      color: colorOf(finalNum),
      time: now.toLocaleString(),
    });

    history = history.slice(0, 10);

    // reset pool for next minute
    frequencyPool = {};
  }
}, 1000);

/* ===== API ===== */
app.get("/data", (req, res) => {
  const now = IST();
  const sec = now.getSeconds();
  const idx = minuteIndex();

  res.json({
    time: now.toLocaleString(),
    period: periodFromIndex(idx),
    remaining: 59 - sec,
    preview: sec >= 30 ? hitRNG() : null,
    history,
  });
});

app.listen(PORT, () =>
  console.log("✅ FINAL SERVER RUNNING (FREQUENCY BASED)")
);
