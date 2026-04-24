const FocusSession = require("../models/FocusSession");
const JournalEntry = require("../models/JournalEntry");
const ScreenTime = require("../models/ScreenTime");
const User = require("../models/User");
const DailyAggregate = require("../models/DailyAggregate");
const ControlScore = require("../models/ControlScore");
const Journal = require("../models/Journal");
const Intervention = require("../models/Intervention");

const safeNumber = (value) => (Number.isFinite(value) ? value : 0);

const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user.userId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const rangeStart = new Date(today);
    rangeStart.setDate(rangeStart.getDate() - 6);

    const [user, latestScreenTime, recentFocusSessions, journalCount, focusSessionsForChart] = await Promise.all([
      User.findById(userId).select("onboardingProfile onboardingCompleted focusStreak"),
      ScreenTime.find({ user: userId, date: { $gte: rangeStart } }).sort({ date: -1 }),
      FocusSession.find({ user: userId, status: "completed" }).sort({ endedAt: -1 }).limit(30),
      JournalEntry.countDocuments({ user: userId }),
      FocusSession.find({ user: userId, status: "completed", endedAt: { $gte: rangeStart } }).select("endedAt"),
    ]);

    const totalScreenTimeLast7Days = latestScreenTime.reduce((sum, entry) => sum + entry.totalMinutes, 0);
    const avgScreenTimeLast7Days =
      latestScreenTime.length > 0 ? Math.round(totalScreenTimeLast7Days / latestScreenTime.length) : 0;

    const totalCompletedFocusMinutes = recentFocusSessions.reduce((sum, session) => sum + session.completedMinutes, 0);
    const totalCompletedFocusSessions = recentFocusSessions.length;

    const labels = Array.from({ length: 7 }).map((_, index) => {
      const date = new Date(rangeStart);
      date.setDate(rangeStart.getDate() + index);
      return {
        key: date.toISOString().slice(0, 10),
        label: date.toLocaleDateString("en-US", { weekday: "short" }),
      };
    });

    const screenMap = new Map(
      latestScreenTime.map((entry) => [new Date(entry.date).toISOString().slice(0, 10), Math.round(entry.totalMinutes / 60)])
    );
    const focusMap = new Map();

    for (const session of focusSessionsForChart) {
      const key = new Date(session.endedAt).toISOString().slice(0, 10);
      focusMap.set(key, (focusMap.get(key) || 0) + 1);
    }

    let rollingStreak = 0;
    const streakProgress = labels.map((item) => {
      const sessionsThatDay = focusMap.get(item.key) || 0;
      rollingStreak = sessionsThatDay > 0 ? rollingStreak + 1 : 0;
      return { day: item.label, streak: rollingStreak };
    });

    const focusSessionsPerDay = labels.map((item) => ({
      day: item.label,
      sessions: focusMap.get(item.key) || 0,
    }));

    const screenTimeTrend = labels.map((item) => ({
      day: item.label,
      hours: screenMap.get(item.key) || 0,
    }));

    // Seed-backed analytics for the Digital Dopamine Detox demo prompt.
    const [dailyAggregates, controlScore, journalCountSeeded, recentInterventions] = await Promise.all([
      DailyAggregate.find({ user: userId }).sort({ date: 1 }).limit(30),
      ControlScore.findOne({ user: userId }),
      Journal.countDocuments({ user: userId }),
      Intervention.find({ user: userId }).sort({ date: -1 }).limit(30),
    ]);

    let demoAnalytics = null;
    if (dailyAggregates.length > 0) {
      const appTotals = {};
      for (const day of dailyAggregates) {
        const entries = day.appBreakdown instanceof Map ? Array.from(day.appBreakdown.entries()) : Object.entries(day.appBreakdown || {});
        for (const [appName, minutes] of entries) {
          appTotals[appName] = safeNumber(appTotals[appName]) + safeNumber(minutes);
        }
      }

      const totalAppMinutes = Object.values(appTotals).reduce((sum, value) => sum + safeNumber(value), 0) || 1;
      const appBreakdown = Object.entries(appTotals)
        .map(([label, minutes]) => ({
          label,
          minutes: safeNumber(minutes),
          pct: Math.round((safeNumber(minutes) / totalAppMinutes) * 100),
        }))
        .sort((a, b) => b.minutes - a.minutes);

      const last7Days = dailyAggregates.slice(-7);
      const avgHoursLast7 =
        last7Days.length > 0
          ? Number(
              (last7Days.reduce((sum, day) => sum + safeNumber(day.totalMinutes), 0) / last7Days.length / 60).toFixed(1)
            )
          : 0;

      const weeklyFocus = (controlScore?.history || []).slice(-7).map((entry) => {
        const dateObj = new Date(entry.date);
        return {
          day: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
          score: safeNumber(entry.score),
          date: entry.date,
        };
      });

      const recentInterventionCount = recentInterventions.length;
      const completedInterventionCount = recentInterventions.filter((item) => item.status === "completed").length;

      demoAnalytics = {
        focusScore: safeNumber(controlScore?.currentScore) ? Math.round(safeNumber(controlScore.currentScore) / 10) : 0,
        controlScore: controlScore
          ? {
              currentScore: safeNumber(controlScore.currentScore),
              level: controlScore.level,
              streakDays: safeNumber(controlScore.streakDays),
              longestStreakDays: safeNumber(controlScore.longestStreakDays),
            }
          : null,
        appBreakdown,
        weeklyFocus,
        metrics: {
          sessions: last7Days.reduce((sum, day) => sum + safeNumber(day.interventionsCompleted), 0),
          activities: journalCountSeeded,
          hours: avgHoursLast7,
          interventionsTriggered: last7Days.reduce((sum, day) => sum + safeNumber(day.interventionsTriggered), 0),
          interventionsCompleted: last7Days.reduce((sum, day) => sum + safeNumber(day.interventionsCompleted), 0),
          recentInterventionCompletionRate:
            recentInterventionCount > 0 ? Math.round((completedInterventionCount / recentInterventionCount) * 100) : 0,
        },
        totals: {
          dailyAggregateCount: dailyAggregates.length,
          journalCount: journalCountSeeded,
          interventionCount: await Intervention.countDocuments({ user: userId }),
        },
      };
    }

    return res.status(200).json({
      onboardingCompleted: user?.onboardingCompleted || false,
      goals: user?.onboardingProfile?.goals || [],
      metrics: {
        avgScreenTimeLast7Days,
        totalCompletedFocusMinutes,
        totalCompletedFocusSessions,
        journalEntriesCount: journalCount,
        focusStreak: user?.focusStreak || 0,
      },
      recentScreenTime: latestScreenTime,
      focusSessionsPerDay,
      screenTimeTrend,
      streakProgress,
      demoAnalytics,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch dashboard analytics.", error: error.message });
  }
};

module.exports = { getDashboardAnalytics };
