const dayjs = require("dayjs");

const clampScore = (score) => Math.min(1000, Math.max(0, score));

const normalizeDate = (date) => (date ? dayjs(date).format("YYYY-MM-DD") : dayjs().format("YYYY-MM-DD"));

const computeWeeklyAverage = (history = []) => {
  if (!history.length) return 0;
  const last7 = history.slice(-7);
  const avg = last7.reduce((sum, item) => sum + (item.score || 0), 0) / last7.length;
  return Math.round(avg);
};

module.exports = { clampScore, normalizeDate, computeWeeklyAverage };
