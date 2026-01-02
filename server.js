// ================================
// FINAL SERVER RNG + PERIOD LOGIC
// ================================

const express = require("express");
const app = express();

let history = [];
let currentPreview = null;
let currentFinal = null;
let rngBucket = [];
let lastLockedPeriod = null;

// ---------- TIME HELPERS ----------
function getIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function getPeriodInfo() {
  const now = getIST();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const minute = now.getHours() * 60 + now.getMinutes();
  const upcomingPeriod = minute + 1; // +1 LOGIC (IMPORTANT)

  const period =
    `${yyyy}${mm}${dd}` +
    `1000` +
    String(upcomingPeriod).padStart(4, "0");

  return {
    now,
    second: now.getSeconds(),
    period
  };
}

// ---------- REAL RNG (0–9) ----------
function pushRNG() {
  const n = Math.floor(Math.random() * 10);
  rngBucket.push(n);
}

// ---------- MOST FREQUENT ----------
function getHighFrequency() {
  const freq = {};
  rngBucket.forEach(n => freq[n] = (freq[n] || 0) + 1);

  let max = -1;
  let selected = null;

  for (let k in freq) {
    if (freq[k] > max) {
      max = freq[k];
      selected = Number(k);
    }
  }
  return selected;
}

// ---------- BIG / SMALL ----------
function bigSmall(n) {
  return n >= 5 ? "Big" : "Small";
}

// ---------- COLOR ----------
function colorOf(n) {
  if (n === 0) return "Violet";
  if (n % 2 === 0) return "Red";
  return "Green";
}

// ---------- MAIN LOOP ----------
setInterval(() => {
  const { second, period } = getPeriodInfo();

  // हर second RNG collect (real behavior)
  pushRNG();

  // 30s PREVIEW
  if (second === 30) {
    currentPreview = getHighFrequency();
  }

  // 59s FINAL LOCK
  if (second === 59) {
    currentFinal = getHighFrequency();

    if (period !== lastLockedPeriod) {
      history.unshift({
        period,
        number: currentFinal,
        size: bigSmall(currentFinal),
        colour: colorOf(currentFinal)
      });

      // history limit (last 50)
      history = history.slice(0, 50);
      lastLockedPeriod = period;
    }

    // reset bucket
    rngBucket = [];
    currentPreview = null;
  }

}, 1000);

// ---------- API ----------
app.get("/api/data", (req, res) => {
  const { second, period } = getPeriodInfo();

  let display = "--";
  if (second >= 30 && second < 59) display = currentPreview;
  if (second >= 59) display = currentFinal;

  res.json({
    period,
    second,
    display,
    history
  });
});

app.listen(3000, () => {
  console.log("✅ FINAL SERVER RNG RUNNING");
});
