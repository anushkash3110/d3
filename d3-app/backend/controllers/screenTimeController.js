const ScreenTime = require("../models/ScreenTime");
const OnboardingProfile = require("../models/OnboardingProfile");
const dayjs = require("dayjs");
const { recalculateScore } = require("../src/modules/score/score.service");
const interventionService = require("../src/modules/intervention/intervention.service");

const upsertScreenTime = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { date, totalMinutes, socialMinutes, entertainmentMinutes, productivityMinutes, notes } = req.body;

    if (!date || totalMinutes === undefined) {
      return res.status(400).json({ message: "Date and totalMinutes are required." });
    }

    const parsedDate = new Date(date);
    parsedDate.setHours(0, 0, 0, 0);

    const entry = await ScreenTime.findOneAndUpdate(
      { user: userId, date: parsedDate },
      {
        totalMinutes,
        socialMinutes: socialMinutes || 0,
        entertainmentMinutes: entertainmentMinutes || 0,
        productivityMinutes: productivityMinutes || 0,
        notes: notes || "",
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    try {
      await recalculateScore(userId, dayjs().format("YYYY-MM-DD"));
    } catch (scoreError) {
      console.error("Score recalculate failed after screen time save:", scoreError.message);
    }

    return res.status(200).json({ message: "Screen time entry saved.", entry });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save screen time entry.", error: error.message });
  }
};

const getScreenTimeHistory = async (req, res) => {
  try {
    const entries = await ScreenTime.find({ user: req.user.userId }).sort({ date: -1 });
    return res.status(200).json({ entries });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch screen time history.", error: error.message });
  }
};

const endScreenTimeSession = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const updatePayload = { ...req.body };
    if (req.body?.date) {
      updatePayload.date = new Date(req.body.date);
    } else {
      delete updatePayload.date;
    }
    const entry = await ScreenTime.findOneAndUpdate(
      { _id: id, user: userId },
      updatePayload,
      { new: true, runValidators: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "Screen time session not found." });
    }

    const durationMin = Number(updatePayload.durationMin ?? updatePayload.totalMinutes ?? entry.totalMinutes ?? 0);
    const responseData = { message: "Screen time session ended.", entry };

    try {
      const profile = await OnboardingProfile.findOne({ user: userId });
      const maxMinutes = profile?.controlPlan?.maxContinuousMinutes ?? 30;
      if (durationMin >= maxMinutes) {
        const interventionResult = await interventionService.triggerIntervention(userId, {
          appName: updatePayload.appName || entry.notes || "Screen",
          continuousMinutes: Math.round(durationMin),
          sessionLogId: entry._id,
        });
        responseData.intervention = interventionResult;
      }
    } catch (interventionError) {
      console.error("Intervention trigger failed after screen time session end:", interventionError.message);
    }

    try {
      await recalculateScore(userId, dayjs().format("YYYY-MM-DD"));
    } catch (scoreError) {
      console.error("Score recalculate failed after screen time session end:", scoreError.message);
    }

    return res.status(200).json(responseData);
  } catch (error) {
    return res.status(500).json({ message: "Failed to end screen time session.", error: error.message });
  }
};

module.exports = { upsertScreenTime, getScreenTimeHistory, endScreenTimeSession };
