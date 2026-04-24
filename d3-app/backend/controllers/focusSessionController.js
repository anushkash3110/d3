const FocusSession = require("../models/FocusSession");
const User = require("../models/User");
const dayjs = require("dayjs");
const { recalculateScore } = require("../src/modules/score/score.service");

const createFocusSession = async (req, res) => {
  try {
    const session = await FocusSession.create({
      ...req.body,
      user: req.user.userId,
    });

    return res.status(201).json({ message: "Focus session created.", session });
  } catch (error) {
    return res.status(500).json({ message: "Failed to create focus session.", error: error.message });
  }
};

const getFocusSessions = async (req, res) => {
  try {
    const sessions = await FocusSession.find({ user: req.user.userId }).sort({ createdAt: -1 });
    return res.status(200).json({ sessions });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch focus sessions.", error: error.message });
  }
};

const updateFocusSession = async (req, res) => {
  try {
    const session = await FocusSession.findOne({ _id: req.params.id, user: req.user.userId });

    if (!session) {
      return res.status(404).json({ message: "Focus session not found." });
    }

    const wasCompleted = session.status === "completed";
    Object.assign(session, req.body);
    await session.save();

    if (!wasCompleted && session.status === "completed") {
      const user = await User.findById(req.user.userId);
      if (user) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const lastDate = user.lastFocusSessionDate ? new Date(user.lastFocusSessionDate) : null;
        if (lastDate) {
          lastDate.setHours(0, 0, 0, 0);
        }

        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (lastDate && lastDate.getTime() === today.getTime()) {
          // Same-day completion keeps current streak value.
        } else if (lastDate && lastDate.getTime() === yesterday.getTime()) {
          user.focusStreak += 1;
        } else {
          user.focusStreak = 1;
        }

        user.lastFocusSessionDate = today;
        await user.save();
      }

      try {
        await recalculateScore(req.user.userId, dayjs().format("YYYY-MM-DD"));
      } catch (scoreError) {
        console.error("Score recalculate failed after focus session completion:", scoreError.message);
      }
    }

    return res.status(200).json({ message: "Focus session updated.", session });
  } catch (error) {
    return res.status(500).json({ message: "Failed to update focus session.", error: error.message });
  }
};

module.exports = { createFocusSession, getFocusSessions, updateFocusSession };
