const mongoose = require("mongoose");

const responseSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const journalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    date: { type: String, required: true },
    mood: { type: Number, required: true, min: 1, max: 5 },
    moodLabel: { type: String, required: true },
    responses: [responseSchema],
    tags: [{ type: String }],
  },
  { timestamps: true }
);

journalSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Journal", journalSchema);
