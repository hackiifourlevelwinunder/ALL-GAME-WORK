const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

/* =====================
   STATIC FILES
===================== */
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

/* =====================
   PERIOD + TIME LOGIC
===================== */
function getGameState() {
  const now = new Date();
  const sec = now.getSeconds();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");

  const minuteIndex = Math.floor(now.getTime() / 60000);
  const period = `${yyyy}${mm}${dd}10001${minuteIndex + 1}`;

  let phase = "RUNNING";
  if (sec >= 30 && sec < 59) phase = "PREVIEW";
  if (sec >= 59) phase = "LOCK";

  return { now, sec, period, phase };
}

/* =====================
   SERVER RNG (ONLY HERE)
===================== */
function generateNumber() {
  return Math.floor(Math.random() * 10);
}

/* =====================
   HISTORY MEMORY
===================== */
let history = [];
let lastPeriodLocked = null;

/* =====================
   API
===================== */
app.get("/api/state", (req, res) => {
  const { now, sec, period, phase } = getGameState();

  let previewNumber = null;

  // Preview number (30 sec)
  if (phase === "PREVIEW") {
    previewNumber = generateNumber();
  }

  // Final lock at 59 sec (ONLY ONCE)
  if (phase === "LOCK" && lastPeriodLocked !== period) {
    const number = generateNumber();

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

    history = history.slice(0, 20);
    lastPeriodLocked = period;
  }

  res.json({
    time: now.toLocaleTimeString(),
    seconds: sec,
    period,
    phase,
    previewNumber,
    history,
  });
});

/* =====================
   SERVER START
===================== */
app.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});
