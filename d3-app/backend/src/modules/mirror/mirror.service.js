const Anthropic = require("@anthropic-ai/sdk");
const dayjs = require("dayjs");
const OnboardingProfile = require("../../../models/OnboardingProfile");
const DailyAggregate = require("../../../models/DailyAggregate");
const JournalEntry = require("../../../models/JournalEntry");
const Intervention = require("../../../models/Intervention");
const ControlScore = require("../../../models/ControlScore");

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const PRIMARY_MODEL = "claude-opus-4-6";
const FALLBACK_MODEL = "claude-3-5-sonnet-latest";

const NEGATIVE_WORDS = [
  "anxious",
  "stressed",
  "tired",
  "overwhelmed",
  "frustrated",
  "distracted",
  "bored",
  "lonely",
  "angry",
  "sad",
  "exhausted",
];

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const average = (values) => {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + toNumber(v), 0) / values.length;
};

const buildUserContext = async (userId) => {
  const startDate = dayjs().subtract(30, "day").startOf("day").toDate();
  const [profile, dailyAggregates, journals, interventions, controlScore] = await Promise.all([
    OnboardingProfile.findOne({ user: userId }).select(
      "computedAddictionLevel mostDistractingApps dailyScreenTimeHours controlPlan"
    ),
    DailyAggregate.find({ user: userId }).sort({ date: 1 }).limit(30),
    JournalEntry.find({ user: userId }).sort({ date: 1 }).limit(28).select("date mood moodLabel responses tags"),
    Intervention.find({
      user: userId,
      $or: [{ triggeredAt: { $gte: startDate } }, { createdAt: { $gte: startDate } }],
    }).select("triggerApp taskType status triggeredAt"),
    ControlScore.findOne({ user: userId }).select("currentScore level streakDays longestStreakDays history"),
  ]);

  const aggregateMinutes = dailyAggregates.map((day) => toNumber(day.totalMinutes));
  const avgDailyMinutes = average(aggregateMinutes);
  const goalMetDays = dailyAggregates.filter((day) => Boolean(day.goalMet)).length;
  const goalMetRate = dailyAggregates.length ? Math.round((goalMetDays / dailyAggregates.length) * 100) : 0;

  const appTotals = new Map();
  for (const day of dailyAggregates) {
    const entries =
      day.appBreakdown instanceof Map ? Array.from(day.appBreakdown.entries()) : Object.entries(day.appBreakdown || {});
    for (const [appName, minutes] of entries) {
      appTotals.set(appName, toNumber(appTotals.get(appName)) + toNumber(minutes));
    }
  }
  const topApps = Array.from(appTotals.entries())
    .map(([appName, totalMinutes]) => ({ appName, totalMinutes }))
    .sort((a, b) => b.totalMinutes - a.totalMinutes)
    .slice(0, 3);

  const completedInterventions = interventions.filter((item) => item.status === "completed").length;
  const interventionCompletionRate = interventions.length
    ? Math.round((completedInterventions / interventions.length) * 100)
    : 0;

  const earlyJournals = journals.slice(0, 15);
  const lateJournals = journals.slice(Math.max(0, journals.length - 15));
  const moodAverageEarly = average(earlyJournals.map((item) => toNumber(item.mood)));
  const moodAverageLate = average(lateJournals.map((item) => toNumber(item.mood)));
  const moodTrend = moodAverageLate > moodAverageEarly ? "improving" : "declining";

  const allAnswerText = journals
    .flatMap((item) => item.responses || [])
    .map((response) => String(response.answer || ""))
    .join(" ")
    .toLowerCase();

  const journalSentimentWords = NEGATIVE_WORDS.map((word) => {
    const matches = allAnswerText.match(new RegExp(`\\b${word}\\b`, "gi"));
    return { word, count: matches ? matches.length : 0 };
  })
    .filter((item) => item.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  const weekdayBuckets = new Map();
  for (const day of dailyAggregates) {
    const date = dayjs(day.date).toDate();
    const weekday = DAY_NAMES[date.getDay()];
    const existing = weekdayBuckets.get(weekday) || { total: 0, count: 0 };
    existing.total += toNumber(day.totalMinutes);
    existing.count += 1;
    weekdayBuckets.set(weekday, existing);
  }

  let worstDayOfWeek = "N/A";
  let bestDayOfWeek = "N/A";
  if (weekdayBuckets.size > 0) {
    const weekdayAverages = Array.from(weekdayBuckets.entries()).map(([dayName, bucket]) => ({
      dayName,
      avg: bucket.count ? bucket.total / bucket.count : 0,
    }));
    weekdayAverages.sort((a, b) => a.avg - b.avg);
    bestDayOfWeek = weekdayAverages[0].dayName;
    worstDayOfWeek = weekdayAverages[weekdayAverages.length - 1].dayName;
  }

  const aggregateByDate = new Map(dailyAggregates.map((day) => [String(day.date), toNumber(day.totalMinutes)]));
  const badMoodNextDayMinutes = journals
    .filter((item) => toNumber(item.mood) <= 2)
    .map((item) => dayjs(item.date).add(1, "day").format("YYYY-MM-DD"))
    .map((nextDate) => aggregateByDate.get(nextDate))
    .filter((value) => Number.isFinite(value));

  const afterBadMood = average(badMoodNextDayMinutes);
  const overall = avgDailyMinutes;
  const multiplier = overall > 0 ? Number((afterBadMood / overall).toFixed(2)) : 0;
  const screenTimeAfterBadMood = {
    afterBadMood: Math.round(afterBadMood),
    overall: Math.round(overall),
    multiplier,
  };

  const history = (controlScore?.history || []).slice(-30);
  const scoreImprovement =
    history.length >= 2 ? toNumber(history[history.length - 1].score) - toNumber(history[0].score) : 0;

  const originalDailyHours = toNumber(profile?.dailyScreenTimeHours);
  const currentAvgHours = avgDailyMinutes / 60;
  const hoursReclaimed = Math.round(((originalDailyHours - currentAvgHours) * 30) * 10) / 10;

  return {
    addictionLevel: profile?.computedAddictionLevel || "Unknown",
    mostDistractingApps: profile?.mostDistractingApps || [],
    dailyGoalMinutes: Math.round(toNumber(profile?.controlPlan?.dailyGoalHours) * 60),
    avgDailyMinutes,
    goalMetRate,
    topApps,
    interventionCompletionRate,
    moodAverageEarly,
    moodAverageLate,
    moodTrend,
    journalSentimentWords,
    worstDayOfWeek,
    bestDayOfWeek,
    screenTimeAfterBadMood,
    scoreImprovement,
    hoursReclaimed,
    totalJournals: journals.length,
    totalInterventions: interventions.length,
  };
};

const extractMessageText = (response) => {
  const chunks = response?.content || [];
  const textChunk = chunks.find((chunk) => chunk.type === "text");
  return (textChunk?.text || "").trim();
};

const parseModelJson = (text) => {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(text.slice(start, end + 1));
    }
    throw new SyntaxError("Mirror analysis did not contain valid JSON.");
  }
};

const generateMirrorAnalysis = async (userId) => {
  const ctx = await buildUserContext(userId);

  const prompt = `
You are a behavioral psychologist and addiction specialist analyzing a user's digital wellness data.
Generate a deeply personal, psychologically insightful analysis. Be specific, direct, and empathetic.
Do NOT be generic. Use the actual numbers and patterns in the data.

USER DATA:
- Name context: This person has been using a dopamine detox app for 30 days
- Addiction level: ${ctx.addictionLevel}
- Most distracting apps: ${ctx.topApps.map((a) => a.appName).join(", ")}
- Average daily screen time: ${Math.round(ctx.avgDailyMinutes)} minutes
- Daily goal: ${ctx.dailyGoalMinutes} minutes
- Goal met rate: ${ctx.goalMetRate}% of days
- Mood trend: ${ctx.moodTrend} (early avg: ${ctx.moodAverageEarly.toFixed(1)}/5 → recent avg: ${ctx.moodAverageLate.toFixed(1)}/5)
- Top emotional words in journals: ${ctx.journalSentimentWords.map((w) => `"${w.word}" (${w.count}x)`).join(", ")}
- Screen time after bad mood days: ${ctx.screenTimeAfterBadMood.multiplier}x higher than average
- Worst day of week: ${ctx.worstDayOfWeek}
- Best day of week: ${ctx.bestDayOfWeek}
- Intervention completion rate: ${ctx.interventionCompletionRate}%
- Control score improvement: +${ctx.scoreImprovement} points over 30 days
- Hours reclaimed this month: ${ctx.hoursReclaimed} hours

Respond ONLY with a valid JSON object in this exact shape (no markdown, no backticks, no extra text):
{
  "coreTrigger": {
    "label": "string — 3-5 word label for the core psychological pattern",
    "headline": "string — one powerful sentence naming their core trigger. Max 15 words. Be specific.",
    "body": "string — 2-3 sentences explaining the trigger using their actual data and numbers. Conversational but precise.",
    "icon": "single emoji that represents this insight",
    "severity": "critical"
  },
  "patterns": [
    {
      "icon": "emoji",
      "title": "string — pattern name, max 5 words",
      "body": "string — 2 sentences. Use specific numbers from their data.",
      "stat": "string — the key number/metric (e.g. '2.3x' or '73%' or '10-11 PM')",
      "statLabel": "string — label for the stat (e.g. 'usage after bad days')",
      "type": "warning | positive"
    }
  ],
  "prescription": {
    "headline": "Your Personalized Protocol",
    "items": [
      { "icon": "emoji", "text": "string — specific, actionable recommendation based on their data. One sentence." }
    ]
  },
  "closingLine": "string — one emotionally resonant sentence about their progress. Mention their actual hours reclaimed or score improvement."
}

Rules:
- patterns array must have exactly 4 items: 2 of type "warning", 2 of type "positive"
- prescription.items must have exactly 4 items
- Use their actual data numbers throughout — never generic advice
- The coreTrigger headline should be the most memorable, quotable insight
- If screenTimeAfterBadMood.multiplier > 1.5, the core trigger should be about emotional escape
- If journalSentimentWords includes stress/anxiety words with high counts, mention the emotional loop
- Be empathetic but honest — this is a mirror, not a cheerleader
`;

let response;

try {
  response = await anthropic.messages.create({
    model: PRIMARY_MODEL,
    max_tokens: 1500,
    messages: [{ role: "user", content: prompt }],
  });
} catch (primaryError) {
  try {
    response = await anthropic.messages.create({
      model: FALLBACK_MODEL,
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }],
    });
  } catch (fallbackError) {
    console.error("Claude unavailable. Using fallback mirror analysis.");

    const topAppName = ctx.topApps && ctx.topApps.length > 0 ? ctx.topApps[0].appName : "your device";
    const avgMins = Math.round(ctx.avgDailyMinutes);
    
    const headline = avgMins > 180 
      ? "Your screen habits show a high distraction cycle" 
      : "Your digital habits show improving focus control";

    const body = `Your average screen time is ${avgMins} minutes per day, and ${topAppName} appears to be your most used app.`;

    const closingLine = ctx.goalMetRate > 60
      ? "Your progress shows that you're gaining real control over your digital habits."
      : "Your data shows the beginning of awareness — the first step toward digital balance.";

    return {
      coreTrigger: {
        label: "Digital Distraction Pattern",
        headline,
        body,
        icon: avgMins > 180 ? "📱" : "🌱",
        severity: avgMins > 180 ? "critical" : "moderate"
      },
      patterns: [
        {
          icon: "⚠️",
          title: "Primary distraction source",
          body: `${topAppName} is currently your most used app.`,
          stat: `${avgMins}`,
          statLabel: "avg minutes/day",
          type: "warning"
        },
        {
          icon: "✅",
          title: "Focus recovery trend",
          body: `Your control score improved by ${ctx.scoreImprovement} points in the last 30 days.`,
          stat: `+${ctx.scoreImprovement}`,
          statLabel: "score improvement",
          type: "positive"
        },
        {
          icon: ctx.interventionCompletionRate < 50 ? "⚠️" : "✅",
          title: "Intervention Response",
          body: `You complete ${ctx.interventionCompletionRate}% of your mindful interventions.`,
          stat: `${ctx.interventionCompletionRate}%`,
          statLabel: "completion rate",
          type: ctx.interventionCompletionRate < 50 ? "warning" : "positive"
        },
        {
          icon: "📝",
          title: "Awareness Practice",
          body: `You logged ${ctx.totalJournals} journal entries this month.`,
          stat: `${ctx.totalJournals}`,
          statLabel: "entries",
          type: "positive"
        }
      ],
      prescription: {
        headline: "Your Personalized Protocol",
        items: [
          { icon: "🍅", text: `Start each morning with a 25 minute focus session before opening ${topAppName}.` },
          { icon: "🚶", text: "Take a short walk break after long screen sessions." },
          { icon: "📖", text: "Replace late night scrolling with reading." },
          { icon: "🧘", text: "Practice breathing exercises during stressful moments." }
        ]
      },
      closingLine,
      meta: {
        avgDailyMinutes: avgMins,
        goalMetRate: ctx.goalMetRate,
        hoursReclaimed: ctx.hoursReclaimed,
        scoreImprovement: ctx.scoreImprovement,
        moodTrend: ctx.moodTrend,
        topApps: ctx.topApps,
        dataPoints: {
          journals: ctx.totalJournals,
          days: 30,
          interventions: ctx.totalInterventions
        }
      }
    };
  }
}

  const text = extractMessageText(response);
  const analysis = parseModelJson(text);
  analysis.meta = {
    avgDailyMinutes: Math.round(ctx.avgDailyMinutes),
    goalMetRate: ctx.goalMetRate,
    hoursReclaimed: ctx.hoursReclaimed,
    scoreImprovement: ctx.scoreImprovement,
    moodTrend: ctx.moodTrend,
    topApps: ctx.topApps,
    dataPoints: {
      journals: ctx.totalJournals,
      days: 30,
      interventions: ctx.totalInterventions,
    },
  };

  return analysis;
};

module.exports = { buildUserContext, generateMirrorAnalysis };
