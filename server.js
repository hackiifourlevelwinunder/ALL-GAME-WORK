const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =========================
   STATIC FILES
========================= */
app.use(express.static("public"));

/* =========================
   HOME ROUTE (FIX Cannot GET)
========================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

/* =========================
   TIME + PERIOD LOGIC
   - 1 minute = 1 period
   - current time 01 => upcoming period 02
   - 30 sec preview
   - 59 sec final lock
========================= */
function getPeriodInfo() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const totalMinutes = Math.floor(now.getTime() / 60000);
  const currentSecond = now.getSeconds();

  const period = `${yyyy}${mm}${dd}10001${totalMinutes + 1}`;

  let phase = "running";
  if (currentSecond >= 30 && currentSecond < 59) phase = "preview";
  if (currentSecond >= 59) phase = "locked";

  return { period, phase, now };
}

/* =========================
   SERVER RNG (0–9)
   - No client generation
   - True random
========================= */
function serverRNG() {
  return Math.floor(Math.random() * 10);
}

/* =========================
   HISTORY STORE (IN-MEMORY)
========================= */
let history = [];
let lastLockedPeriod = null;

/* =========================
   API DATA
========================= */
app.get("/api/data", (req, res) => {
  const { period, phase, now } = getPeriodInfo();

  // Generate number only once per period (on lock)
  if (phase === "locked" && lastLockedPeriod !== period) {
    const number = serverRNG();

    const bigSmall = number >= 5 ? "Big" : "Small";
    let colour = "Green";
    if (number === 0 || number === 5) colour = "Violet";
    else if (number % 2 === 0) colour = "Red";

    history.unshift({
      period,
      number,
      bigSmall,
      colour,
    });

    history = history.slice(0, 50); // last 50 only
    lastLockedPeriod = period;
  }

  res.json({
    period,
    phase,
    serverTime: now.toISOString(),
    history,
  });
});

/* =========================
   404 SAFETY
========================= */
app.use((req, res) => {
  res.status(404).send("Not Found");
});

/* =========================
   START SERVER
========================= */
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
