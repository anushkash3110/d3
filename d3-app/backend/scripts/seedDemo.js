const bcrypt = require("bcryptjs");
const dayjs = require("dayjs");
const { faker } = require("@faker-js/faker");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

const connectDB = require("../config/db");
const User = require("../models/User");
const OnboardingProfile = require("../models/OnboardingProfile");
const DailyAggregate = require("../models/DailyAggregate");
const ControlScore = require("../models/ControlScore");
const Journal = require("../models/Journal");
const Intervention = require("../models/Intervention");

dotenv.config();

const DEMO_USER = {
  name: "Arjun Demo",
  email: "demo@detox.app",
  password: "Demo1234!",
};

const moodLabelMap = {
  1: "Terrible",
  2: "Bad",
  3: "Neutral",
  4: "Good",
  5: "Great",
};

const taskTypes = ["water", "breathing", "walk", "stretch"];

const randomInt = (min, max) => faker.number.int({ min, max });

const distribution = (total, map) => {
  const entries = Object.entries(map);
  let remaining = total;
  return Object.fromEntries(
    entries.map(([key, ratio], index) => {
      if (index === entries.length - 1) {
        return [key, remaining];
      }
      const value = Math.round(total * ratio);
      remaining -= value;
      return [key, value];
    })
  );
};

const buildDailyAggregates = (userId, dates) =>
  dates.map((date, index) => {
    const isBadPeriod = index < 15;
    const totalMinutes = isBadPeriod ? randomInt(180, 360) : randomInt(60, 130);
    return {
      user: userId,
      date: date.format("YYYY-MM-DD"),
      totalMinutes,
      goalMinutes: 120,
      goalMet: totalMinutes <= 120,
      interventionsTriggered: isBadPeriod ? randomInt(4, 8) : randomInt(1, 3),
      interventionsCompleted: isBadPeriod ? randomInt(1, 3) : randomInt(2, 4),
      appBreakdown: isBadPeriod
        ? distribution(totalMinutes, {
            Instagram: 0.4,
            TikTok: 0.3,
            YouTube: 0.2,
            Other: 0.1,
          })
        : distribution(totalMinutes, {
            Instagram: 0.3,
            YouTube: 0.25,
            Notion: 0.25,
            Kindle: 0.2,
          }),
    };
  });

const buildControlScoreHistory = (dailyAggregates) => {
  const history = [];
  let score = 120;

  dailyAggregates.forEach((day, index) => {
    const isBadPeriod = index < 15;
    let delta = isBadPeriod ? -randomInt(10, 30) : randomInt(30, 60);
    if (index === dailyAggregates.length - 1) {
      delta = 620 - score;
    }
    score += delta;
    history.push({
      date: day.date,
      score,
      delta,
      reason: day.goalMet ? "Goal met, Journal submitted" : "Goal missed",
    });
  });

  if (history.length > 0) {
    history[history.length - 1].score = 620;
  }

  return history;
};

const buildJournals = (userId, dates, skipSet) => {
  const journals = [];
  dates.forEach((date, index) => {
    if (skipSet.has(index)) {
      return;
    }

    const recoveryPeriod = index >= 15;
    const mood = recoveryPeriod ? randomInt(3, 5) : randomInt(1, 3);
    const highMood = mood >= 4;
    journals.push({
      user: userId,
      date: date.format("YYYY-MM-DD"),
      mood,
      moodLabel: moodLabelMap[mood],
      responses: [
        {
          question: "How do you feel today?",
          answer: highMood ? "Focused and productive today" : "Feeling scattered and distracted",
        },
        {
          question: "How do you feel today?",
          answer: highMood ? "Calm and clear through most of the day" : "A bit tired and pulled by urges",
        },
      ],
      tags: highMood ? ["productive", "calm"] : ["distracted", "tired"],
    });
  });
  return journals;
};

const buildInterventions = (userId, dates) => {
  const interventions = [];

  dates.forEach((date, index) => {
    const isBadPeriod = index < 15;
    const count = isBadPeriod ? randomInt(3, 6) : randomInt(1, 2);
    for (let i = 0; i < count; i += 1) {
      interventions.push({
        user: userId,
        date: date.format("YYYY-MM-DD"),
        triggerApp: faker.helpers.arrayElement(["Instagram", "TikTok"]),
        mode: "pause",
        status: faker.helpers.weightedArrayElement([
          { value: "completed", weight: 8 },
          { value: "skipped", weight: 2 },
        ]),
        taskType: taskTypes[(index + i) % taskTypes.length],
      });
    }
  });

  // Keep demo output stable for showcasing.
  if (interventions.length > 67) {
    interventions.length = 67;
  }
  while (interventions.length < 67) {
    interventions.push({
      user: userId,
      date: dates[dates.length - 1].format("YYYY-MM-DD"),
      triggerApp: "Instagram",
      mode: "pause",
      status: "completed",
      taskType: taskTypes[interventions.length % taskTypes.length],
    });
  }

  return interventions;
};

const seedDemoData = async () => {
  const existingUser = await User.findOne({ email: DEMO_USER.email });
  if (existingUser) {
    const userId = existingUser._id;
    await Promise.all([
      OnboardingProfile.deleteMany({ user: userId }),
      DailyAggregate.deleteMany({ user: userId }),
      ControlScore.deleteMany({ user: userId }),
      Journal.deleteMany({ user: userId }),
      Intervention.deleteMany({ user: userId }),
    ]);
    await User.deleteOne({ _id: userId });
  }

  const hashedPassword = await bcrypt.hash(DEMO_USER.password, 10);
  const user = await User.create({
    name: DEMO_USER.name,
    email: DEMO_USER.email,
    password: hashedPassword,
    onboardingCompleted: true,
  });

  await OnboardingProfile.create({
    user: user._id,
    dailyScreenTimeHours: 6,
    mostDistractingApps: ["Instagram", "TikTok", "YouTube", "Twitter"],
    sleepTime: "23:30",
    wakeTime: "07:00",
    productivityLevel: 4,
    selfAddictionLevel: "Moderate",
    computedAddictionLevel: "Moderate",
    controlPlan: {
      reminderIntervalMinutes: 20,
      maxContinuousMinutes: 30,
      breakDurationMinutes: 7,
      dailyGoalHours: 2,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      interventionMode: "pause",
    },
    isOnboardingDone: true,
  });

  // Keep old and existing onboarding payload in sync for current APIs.
  user.onboardingProfile = {
    dailyScreenTimeHours: 6,
    mostDistractingApps: ["Instagram", "TikTok", "YouTube", "Twitter"],
    sleepTime: "23:30",
    wakeTime: "07:00",
    productivityLevel: 4,
    selfAddictionLevel: "Moderate",
    computedAddictionLevel: "Moderate",
    controlPlan: {
      reminderIntervalMinutes: 20,
      maxContinuousMinutes: 30,
      breakDurationMinutes: 7,
      dailyGoalHours: 2,
      pomodoroWorkMinutes: 25,
      pomodoroBreakMinutes: 5,
      interventionMode: "pause",
    },
    isOnboardingDone: true,
  };
  await user.save();

  const dates = Array.from({ length: 30 }).map((_, i) => dayjs().subtract(29 - i, "day"));
  const dailyAggregates = buildDailyAggregates(user._id, dates);
  await DailyAggregate.insertMany(dailyAggregates);

  const controlHistory = buildControlScoreHistory(dailyAggregates);
  await ControlScore.create({
    user: user._id,
    currentScore: 620,
    level: "Controlled",
    streakDays: 11,
    longestStreakDays: 11,
    history: controlHistory,
  });

  const skipIndexes = new Set(faker.helpers.arrayElements(Array.from({ length: 30 }, (_, i) => i), 2));
  const journals = buildJournals(user._id, dates, skipIndexes);
  await Journal.insertMany(journals);

  const interventions = buildInterventions(user._id, dates);
  await Intervention.insertMany(interventions);

  const summary = {
    userId: user._id.toString(),
    email: DEMO_USER.email,
    password: DEMO_USER.password,
    dailyAggregateCount: dailyAggregates.length,
    journalCount: journals.length,
    controlScore: { currentScore: 620, level: "Controlled", streakDays: 11 },
    interventionCount: interventions.length,
  };

  console.log(`✅ Demo user created: ${summary.email} / ${summary.password}`);
  console.log(`✅ ${summary.dailyAggregateCount} DailyAggregate documents created`);
  console.log(`✅ ${summary.journalCount} Journal entries created`);
  console.log(
    `✅ ControlScore: ${summary.controlScore.currentScore} (${summary.controlScore.level}) | Streak: ${summary.controlScore.streakDays} days`
  );
  console.log(`✅ ${summary.interventionCount} Intervention records created`);
  console.log("🚀 Seed complete. Run the app and log in.");

  return summary;
};

const runSeedCli = async () => {
  try {
    await connectDB();
    await seedDemoData();
  } catch (error) {
    console.error("Seed failed:", error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
  }
};

if (require.main === module) {
  runSeedCli();
}

module.exports = { seedDemoData };
