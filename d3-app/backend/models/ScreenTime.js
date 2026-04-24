const mongoose = require("mongoose");

const screenTimeSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, required: true },
    totalMinutes: { type: Number, required: true, min: 0 },
    socialMinutes: { type: Number, default: 0, min: 0 },
    entertainmentMinutes: { type: Number, default: 0, min: 0 },
    productivityMinutes: { type: Number, default: 0, min: 0 },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

screenTimeSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("ScreenTime", screenTimeSchema);
