const mongoose = require("mongoose");

const focusSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    plannedMinutes: { type: Number, required: true, min: 1 },
    completedMinutes: { type: Number, default: 0, min: 0 },
    status: { type: String, enum: ["planned", "in_progress", "completed", "cancelled"], default: "planned" },
    startedAt: { type: Date },
    endedAt: { type: Date },
    distractionsCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("FocusSession", focusSessionSchema);
