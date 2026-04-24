const mongoose = require("mongoose");

const dailyAggregateSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    totalMinutes: { type: Number, required: true, min: 0 },
    goalMinutes: { type: Number, required: true, min: 0 },
    goalMet: { type: Boolean, default: false },
    interventionsTriggered: { type: Number, default: 0 },
    interventionsCompleted: { type: Number, default: 0 },
    appBreakdown: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  { timestamps: true }
);

dailyAggregateSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("DailyAggregate", dailyAggregateSchema);
