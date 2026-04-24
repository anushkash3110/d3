const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    activityId: { type: String, required: true, trim: true },
    completedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

activityLogSchema.index({ user: 1, date: 1, activityId: 1 }, { unique: true });

module.exports = mongoose.model("ActivityLog", activityLogSchema);
