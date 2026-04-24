const mongoose = require("mongoose");

const interventionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String },
    triggerApp: { type: String, required: true },
    mode: { type: String, enum: ["gentle", "pause", "lock"], default: "pause" },
    status: { type: String, enum: ["pending", "completed", "skipped"], default: "pending" },
    taskType: { type: String, required: true },
    taskAssigned: { type: String },
    linkedSessionId: { type: mongoose.Schema.Types.ObjectId, default: null },
    triggeredAt: { type: Date, default: Date.now },
    completedAt: { type: Date, default: null },
    overrideUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

interventionSchema.index({ user: 1, triggeredAt: -1 });
interventionSchema.index({ user: 1, date: 1 });

module.exports = mongoose.model("Intervention", interventionSchema);
