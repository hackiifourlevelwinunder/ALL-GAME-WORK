const express = require("express");
const path = require("path");
const app = express();

const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static("public"));

/* ================= TIME (IST) ================= */
function getIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

/* ================= PERIOD LOGIC ================= */
/*
Rule:
- Current minute = upcoming period
- Example: 12:01 → period = 12:02
*/
function buildPeriod(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");

  const totalMinutes = date.getHours() * 60 + date.getMinutes() + 1;

  return `${y}${m}${d}1000${totalMinutes}`;
}

/* ================= RNG (PURE 0–9 | 50–50) ================= */
function serverRNG() {
  return Math.floor(Math.random() * 10);
}

/* ================= GAME STATE ================= */
let GAME = {
  period: null,
  preview: null,
  final: null,
  history: [],
};

/* ================= ENGINE ================= */
setInterval(() => {
  const now = getIST();
  const sec = now.getSeconds();
  const period = buildPeriod(now);

  // NEW PERIOD DETECT
  if (GAME.period !== period) {
    GAME.period = period;
    GAME.preview = null;
    GAME.final = null;
  }

  // PREVIEW @ 30 sec
  if (sec === 30 && GAME.preview === null) {
    GAME.preview = serverRNG();
  }

  // FINAL LOCK @ 59 sec
  if (sec === 59 && GAME.final === null) {
    GAME.final = GAME.preview ?? serverRNG();

    GAME.history.unshift({
      period: GAME.period,
      number: GAME.final,
      bigSmall: GAME.final >= 5 ? "Big" : "Small",
      colour:
        GAME.final === 0
          ? "Violet"
          : GAME.final % 2 === 0
          ? "Red"
          : "Green",
    });

    if (GAME.history.length > 10) GAME.history.pop();
  }
}, 1000);

/* ================= API ================= */
app.get("/api/status", (req, res) => {
  const now = getIST();
  const sec = now.getSeconds();

  res.json({
    time: now,
    remaining: 60 - sec,
    period: GAME.period,
    result: sec >= 30 ? GAME.preview : "--",
    history: GAME.history,
  });
});

/* ================= ROUTE ================= */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

/* ================= START ================= */
app.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
RT)
