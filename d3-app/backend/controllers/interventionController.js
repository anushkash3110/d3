const dayjs = require("dayjs");
const Intervention = require("../models/Intervention");
const { recalculateScore } = require("../src/modules/score/score.service");

const completeIntervention = async (req, res) => {
  try {
    const intervention = await Intervention.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { status: "completed" },
      { new: true, runValidators: true }
    );

    if (!intervention) {
      return res.status(404).json({ message: "Intervention not found." });
    }

    try {
      await recalculateScore(req.user.userId, dayjs().format("YYYY-MM-DD"));
    } catch (scoreError) {
      console.error("Score recalculate failed after intervention complete:", scoreError.message);
    }

    return res.status(200).json({ message: "Intervention marked completed.", intervention });
  } catch (error) {
    return res.status(500).json({ message: "Failed to complete intervention.", error: error.message });
  }
};

const skipIntervention = async (req, res) => {
  try {
    const intervention = await Intervention.findOneAndUpdate(
      { _id: req.params.id, user: req.user.userId },
      { status: "skipped" },
      { new: true, runValidators: true }
    );

    if (!intervention) {
      return res.status(404).json({ message: "Intervention not found." });
    }

    try {
      await recalculateScore(req.user.userId, dayjs().format("YYYY-MM-DD"));
    } catch (scoreError) {
      console.error("Score recalculate failed after intervention skip:", scoreError.message);
    }

    return res.status(200).json({ message: "Intervention marked skipped.", intervention });
  } catch (error) {
    return res.status(500).json({ message: "Failed to skip intervention.", error: error.message });
  }
};

module.exports = { completeIntervention, skipIntervention };
