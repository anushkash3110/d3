const dayjs = require("dayjs");
const DailyAggregate = require("../../../models/DailyAggregate");
const Journal = require("../../../models/Journal");
const JournalEntry = require("../../../models/JournalEntry");
const Intervention = require("../../../models/Intervention");
const ControlScore = require("../../../models/ControlScore");
const { clampScore, normalizeDate } = require("../../utils/score.utils");

const SCORE_WEIGHTS = {
  goalMet: 50,
  underGoalPerHour: 10, // max 30 (3 hours)
  journalSubmitted: 20,
  interventionCompleted: 15, // per completion
  streakBonus: 5, // per streak day, capped at 50
  goalMissed: -40,
  overGoalPer30Min: -5, // max -30 (6 slots)
  interventionSkipped: -10,
};

const LEVELS = [
  { name: "Struggling", min: 0, max: 149, emoji: "😔", color: "#EF4444" },
  { name: "Aware", min: 150, max: 299, emoji: "👁️", color: "#F97316" },
  { name: "Improving", min: 300, max: 499, emoji: "📈", color: "#EAB308" },
  { name: "Controlled", min: 500, max: 749, emoji: "✅", color: "#22C55E" },
  { name: "Master", min: 750, max: 1000, emoji: "🏆", color: "#8B5CF6" },
];

const getLevelFromScore = (score) => LEVELS.find((level) => score >= level.min && score <= level.max) || LEVELS[0];

const getOrCreateControlScore = async (userId) => {
  let controlScore = await ControlScore.findOne({ user: userId });
  if (!controlScore) {
    const level = getLevelFromScore(0);
    controlScore = await ControlScore.create({
      user: userId,
      currentScore: 0,
      level: level.name,
      streakDays: 0,
      longestStreakDays: 0,
      lastStreakDate: null,
      history: [],
    });
  }
  return controlScore;
};

const recalculateScore = async (userId, date) => {
  const scoreDate = normalizeDate(date);
  const dateStart = dayjs(scoreDate).startOf("day").toDate();
  const dateEnd = dayjs(scoreDate).endOf("day").toDate();
  const [dailyAggregate, journal, journalEntry, interventions, controlScore] = await Promise.all([
    DailyAggregate.findOne({ user: userId, date: scoreDate }),
    Journal.findOne({ user: userId, date: scoreDate }),
    JournalEntry.findOne({ user: userId, date: { $gte: dateStart, $lte: dateEnd } }),
    Intervention.find({ user: userId, date: scoreDate }),
    getOrCreateControlScore(userId),
  ]);

  let delta = 0;
  const reasons = [];

  if (dailyAggregate?.goalMet) {
    delta += SCORE_WEIGHTS.goalMet;
    reasons.push("Goal met");

    const underGoalMinutes = Math.max(0, (dailyAggregate.goalMinutes || 0) - (dailyAggregate.totalMinutes || 0));
    const underGoalHours = underGoalMinutes / 60;
    const underGoalBonus = Math.min(3, underGoalHours) * SCORE_WEIGHTS.underGoalPerHour;
    if (underGoalBonus > 0) {
      delta += underGoalBonus;
      reasons.push(`Under goal bonus +${Math.round(underGoalBonus)}`);
    }
  } else if (dailyAggregate) {
    delta += SCORE_WEIGHTS.goalMissed;
    reasons.push("Goal missed");
    const overGoalMinutes = Math.max(0, (dailyAggregate.totalMinutes || 0) - (dailyAggregate.goalMinutes || 0));
    const overGoalSlots = Math.min(6, Math.floor(overGoalMinutes / 30));
    const overGoalPenalty = overGoalSlots * SCORE_WEIGHTS.overGoalPer30Min;
    if (overGoalPenalty < 0) {
      delta += overGoalPenalty;
      reasons.push(`Over goal penalty ${overGoalPenalty}`);
    }
  }

  if (journal || journalEntry) {
    delta += SCORE_WEIGHTS.journalSubmitted;
    reasons.push("Journal submitted");
  }

  const completedCount = interventions.filter((item) => item.status === "completed").length;
  const skippedCount = interventions.filter((item) => item.status === "skipped").length;
  if (completedCount > 0) {
    const completedPoints = completedCount * SCORE_WEIGHTS.interventionCompleted;
    delta += completedPoints;
    reasons.push(`Interventions completed +${completedPoints}`);
  }
  if (skippedCount > 0) {
    const skippedPenalty = skippedCount * SCORE_WEIGHTS.interventionSkipped;
    delta += skippedPenalty;
    reasons.push(`Interventions skipped ${skippedPenalty}`);
  }

  const streakBonus = Math.min(50, controlScore.streakDays * SCORE_WEIGHTS.streakBonus);
  if (streakBonus > 0) {
    delta += streakBonus;
    reasons.push(`Streak bonus +${streakBonus}`);
  }

  const newScore = clampScore(Math.round((controlScore.currentScore || 0) + delta));
  const newLevel = getLevelFromScore(newScore);

  const reasonSummary = reasons.length ? reasons.join(", ") : "No qualifying score events";
  const historyEntry = { date: scoreDate, score: newScore, delta: Math.round(delta), reason: reasonSummary };
  controlScore.history.push(historyEntry);

  controlScore.currentScore = newScore;
  controlScore.level = newLevel.name;
  await controlScore.save();

  return { newScore, newLevel, delta: Math.round(delta), reasons };
};

const updateStreak = async (userId, date) => {
  const referenceDate = normalizeDate(date);
  const yesterday = dayjs(referenceDate).subtract(1, "day").format("YYYY-MM-DD");
  const yesterdayStart = dayjs(yesterday).startOf("day").toDate();
  const yesterdayEnd = dayjs(yesterday).endOf("day").toDate();

  const [yesterdayAggregate, yesterdayJournal, yesterdayJournalEntry, controlScore] = await Promise.all([
    DailyAggregate.findOne({ user: userId, date: yesterday }),
    Journal.findOne({ user: userId, date: yesterday }),
    JournalEntry.findOne({ user: userId, date: { $gte: yesterdayStart, $lte: yesterdayEnd } }),
    getOrCreateControlScore(userId),
  ]);

  const isStreakDay = Boolean(yesterdayAggregate?.goalMet && (yesterdayJournal || yesterdayJournalEntry));
  controlScore.streakDays = isStreakDay ? controlScore.streakDays + 1 : 0;
  controlScore.longestStreakDays = Math.max(controlScore.longestStreakDays, controlScore.streakDays);
  controlScore.lastStreakDate = isStreakDay ? yesterday : controlScore.lastStreakDate;
  await controlScore.save();

  return {
    streakDays: controlScore.streakDays,
    longestStreakDays: controlScore.longestStreakDays,
    streakBroken: !isStreakDay,
  };
};

const getScoreHistory = async (userId, days = 30) => {
  const controlScore = await getOrCreateControlScore(userId);
  return controlScore.history.slice(-Math.max(1, Number(days) || 30)).map((entry) => ({
    date: entry.date,
    score: entry.score,
    delta: entry.delta,
    reason: entry.reason,
  }));
};

module.exports = {
  SCORE_WEIGHTS,
  LEVELS,
  getLevelFromScore,
  getOrCreateControlScore,
  recalculateScore,
  updateStreak,
  getScoreHistory,
};
