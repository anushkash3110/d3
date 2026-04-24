const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema(
  {
    ageRange: { type: String, default: "" },
    goals: [{ type: String }],
    dailyScreenTimeGoalMinutes: { type: Number, default: 120 },
    preferredFocusSessionMinutes: { type: Number, default: 25 },
    distractionTriggers: [{ type: String }],
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    onboardingCompleted: { type: Boolean, default: false },
    onboardingProfile: { type: onboardingSchema, default: () => ({}) },
    focusStreak: { type: Number, default: 0, min: 0 },
    lastFocusSessionDate: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
