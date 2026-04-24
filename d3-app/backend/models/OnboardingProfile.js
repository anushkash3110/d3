const mongoose = require("mongoose");

const controlPlanSchema = new mongoose.Schema(
  {
    reminderIntervalMinutes: { type: Number, required: true },
    maxContinuousMinutes: { type: Number, required: true },
    breakDurationMinutes: { type: Number, required: true },
    dailyGoalHours: { type: Number, required: true },
    pomodoroWorkMinutes: { type: Number, required: true },
    pomodoroBreakMinutes: { type: Number, required: true },
    interventionMode: { type: String, default: "pause" },
  },
  { _id: false }
);

const onboardingProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    dailyScreenTimeHours: { type: Number, required: true },
    mostDistractingApps: [{ type: String }],
    sleepTime: { type: String, required: true },
    wakeTime: { type: String, required: true },
    productivityLevel: { type: Number, min: 1, max: 5, required: true },
    selfAddictionLevel: { type: String, required: true },
    computedAddictionLevel: { type: String, required: true },
    controlPlan: { type: controlPlanSchema, required: true },
    isOnboardingDone: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("OnboardingProfile", onboardingProfileSchema);
