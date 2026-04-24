const mongoose = require("mongoose");

const historySchema = new mongoose.Schema(
  {
    date: { type: String, required: true },
    score: { type: Number, required: true },
    delta: { type: Number, required: true },
    reason: { type: String, required: true },
  },
  { _id: false }
);

const controlScoreSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    currentScore: { type: Number, required: true },
    level: { type: String, required: true },
    streakDays: { type: Number, default: 0 },
    longestStreakDays: { type: Number, default: 0 },
    lastStreakDate: { type: String, default: null },
    history: [historySchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("ControlScore", controlScoreSchema);
