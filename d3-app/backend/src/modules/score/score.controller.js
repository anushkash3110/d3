const { computeWeeklyAverage, normalizeDate } = require("../../utils/score.utils");
const {
  getLevelFromScore,
  getScoreHistory,
  getOrCreateControlScore,
  recalculateScore,
  updateStreak,
} = require("./score.service");

const getUserId = (req) => req.user?.id || req.user?.userId;

const getScoreOverview = async (req, res) => {
  try {
    const userId = getUserId(req);
    const controlScore = await getOrCreateControlScore(userId);

    const level = getLevelFromScore(controlScore.currentScore);
    return res.status(200).json({
      currentScore: controlScore.currentScore,
      level: level.name,
      levelEmoji: level.emoji,
      levelColor: level.color,
      streak: controlScore.streakDays,
      longestStreak: controlScore.longestStreakDays,
      weeklyAvgScore: computeWeeklyAverage(controlScore.history),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch score overview.", error: error.message });
  }
};

const getScoreHistoryController = async (req, res) => {
  try {
    const userId = getUserId(req);
    const days = Number(req.query.days || 30);
    const history = await getScoreHistory(userId, days);
    return res.status(200).json({ history });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch score history.", error: error.message });
  }
};

const getScoreStreak = async (req, res) => {
  try {
    const userId = getUserId(req);
    const controlScore = await getOrCreateControlScore(userId);

    return res.status(200).json({
      streakDays: controlScore.streakDays,
      longestStreakDays: controlScore.longestStreakDays,
      lastStreakDate: controlScore.lastStreakDate || null,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch streak.", error: error.message });
  }
};

const postRecalculateScore = async (req, res) => {
  try {
    const userId = getUserId(req);
    const scoreDate = normalizeDate(req.body?.date);
    const scoreResult = await recalculateScore(userId, scoreDate);
    const streakResult = await updateStreak(userId, scoreDate);
    return res.status(200).json({
      ...scoreResult,
      ...streakResult,
      date: scoreDate,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to recalculate score.", error: error.message });
  }
};

module.exports = {
  getScoreOverview,
  getScoreHistoryController,
  getScoreStreak,
  postRecalculateScore,
};
