const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

/* ========= IST TIME ========= */
function getIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* ========= PERIOD LOGIC =========
   Rule:
   - Every 1 minute = 1 period
   - Period = YYYYMMDD1000 + minuteCount
   - minuteCount = total minutes from 00:00 + 1
*/
function buildPeriod(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const minuteCount = date.getHours() * 60 + date.getMinutes() + 1;
  return `${y}${m}${d}1000${minuteCount}`;
}

/* ========= RNG (0–9) ========= */
function rng() {
  return Math.floor(Math.random() * 10);
}

/* ========= GAME STATE ========= */
let GAME = {
  period: null,
  preview: null,
  final: null,
  history: []
};

/* ========= MAIN TIMER ========= */
setInterval(() => {
  const now = getIST();
  const sec = now.getSeconds();
  const currentPeriod = buildPeriod(now);

  /* New period */
  if (GAME.period !== currentPeriod) {
    GAME.period = currentPeriod;
    GAME.preview = null;
    GAME.final = null;
  }

  /* 30 second PREVIEW */
  if (sec === 30 && GAME.preview === null) {
    GAME.preview = rng();
  }

  /* 59 second FINAL + LOCK + HISTORY */
  if (sec === 59 && GAME.final === null) {
    GAME.final = GAME.preview !== null ? GAME.preview : rng();

    GAME.history.unshift({
      period: GAME.period,
      number: GAME.final,
      bigSmall: GAME.final >= 5 ? "Big" : "Small",
      colour:
        GAME.final === 0
          ? "Violet"
          : GAME.final % 2 === 0
          ? "Red"
          : "Green"
    });

    /* Only last 20 history */
    if (GAME.history.length > 20) GAME.history.pop();
  }
}, 1000);

/* ========= API ========= */
app.get("/api/status", (req, res) => {
  const now = getIST();
  const sec = now.getSeconds();

  res.json({
    period: GAME.period,
    timeRemaining: 60 - sec,
    result: sec >= 30 ? GAME.preview : "--",
    history: GAME.history
  });
});

/* ========= FRONT ========= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

/* ========= START ========= */
app.listen(PORT, () => {
  console.log("SERVER RUNNING ON PORT", PORT);
});
