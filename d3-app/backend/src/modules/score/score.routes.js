const express = require("express");
const {
  getScoreOverview,
  getScoreHistoryController,
  getScoreStreak,
  postRecalculateScore,
} = require("./score.controller");

const router = express.Router();

router.get("/", getScoreOverview);
router.get("/history", getScoreHistoryController);
router.get("/streak", getScoreStreak);
router.post("/recalculate", postRecalculateScore);

module.exports = router;
