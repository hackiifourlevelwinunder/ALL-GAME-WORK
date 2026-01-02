const express = require("express");
const path = require("path");
const app = express();
const PORT = process.env.PORT || 3000;

/* ---------- STATIC FILES ---------- */
app.use(express.static("public"));

/* ---------- ROOT FIX ---------- */
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "game.html"));
});

/* ---------- GAME LOGIC ---------- */

let currentPeriod = null;
let previewResult = null;
let finalResult = null;
let history = [];

function getIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

function generatePeriod() {
  const now = getIST();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const minute = now.getHours() * 60 + now.getMinutes() + 1; // +1 rule
  return `${yyyy}${mm}${dd}1000${minute}`;
}

function rng() {
  return Math.floor(Math.random() * 10);
}

setInterval(() => {
  const now = getIST();
  const sec = now.getSeconds();
  const period = generatePeriod();

  if (currentPeriod !== period) {
    currentPeriod = period;
    previewResult = null;
    finalResult = null;
  }

  if (sec === 30 && previewResult === null) {
    previewResult = rng();
  }

  if (sec === 59 && finalResult === null) {
    finalResult = previewResult ?? rng();

    history.unshift({
      period: currentPeriod,
      number: finalResult,
      bigSmall: finalResult >= 5 ? "Big" : "Small",
      colour:
        finalResult === 0
          ? "Violet"
          : finalResult % 2 === 0
          ? "Red"
          : "Green",
    });

    if (history.length > 10) history.pop();
  }
}, 1000);

app.get("/api/status", (req, res) => {
  const now = getIST();
  res.json({
    time: now,
    remaining: 60 - now.getSeconds(),
    period: currentPeriod,
    preview: previewResult,
    final: finalResult,
    history,
  });
});

app.listen(PORT, () => {
  console.log("SERVER RUNNING ON", PORT);
});
