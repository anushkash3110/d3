const JournalEntry = require("../models/JournalEntry");
const dayjs = require("dayjs");
const { recalculateScore } = require("../src/modules/score/score.service");

const createJournalEntry = async (req, res) => {
  try {
    const entry = await JournalEntry.create({
      ...req.body,
      user: req.user.userId,
    });

    try {
      await recalculateScore(req.user.userId, dayjs().format("YYYY-MM-DD"));
    } catch (scoreError) {
      console.error("Score recalculate failed after journal save:", scoreError.message);
    }

    return res.status(201).json({ message: "Journal entry created.", entry });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create journal entry.", error: error.message });
  }
};

const getJournalEntries = async (req, res) => {
  try {
    const entries = await JournalEntry.find({ user: req.user.userId }).sort({ date: -1, createdAt: -1 });
    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch journal entries.", error: error.message });
  }
};

module.exports = { createJournalEntry, getJournalEntries };
