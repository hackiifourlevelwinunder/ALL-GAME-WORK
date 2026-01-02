const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

let currentPeriod = null;
let previewResult = null;
let finalResult = null;
let history = [];

function getISTTime() {
  const now = new Date();
  return new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function generatePeriod() {
  const now = getISTTime();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const minutes = now.getHours() * 60 + now.getMinutes() + 1; // +1 LOGIC

  return `${yyyy}${mm}${dd}1000${minutes}`;
}

function rngNumber() {
  return Math.floor(Math.random() * 10); // 0–9 (50–50 natural)
}

setInterval(() => {
  const now = getISTTime();
  const sec = now.getSeconds();
  const period = generatePeriod();

  // New period start
  if (currentPeriod !== period) {
    currentPeriod = period;
    previewResult = null;
    finalResult = null;
  }

  // 30 sec preview
  if (sec === 30 && previewResult === null) {
    previewResult = rngNumber();
  }

  // 59 sec final lock
  if (sec === 59 && finalResult === null) {
    finalResult = previewResult !== null ? previewResult : rngNumber();

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
  const now = getISTTime();
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
  console.log("Server running on port", PORT);
});
