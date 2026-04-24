const mongoose = require("mongoose");

const journalEntrySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: Date, default: Date.now },
    moodScore: { type: Number, min: 1, max: 10 },
    energyScore: { type: Number, min: 1, max: 10 },
    reflection: { type: String, required: true, trim: true },
    gratitude: [{ type: String }],
    wins: [{ type: String }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("JournalEntry", journalEntrySchema);
