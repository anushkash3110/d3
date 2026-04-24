const dayjs = require("dayjs");
const ActivityLog = require("../models/ActivityLog");

const listActivities = async (req, res) => {
  try {
    const date = req.query.date || dayjs().format("YYYY-MM-DD");
    const entries = await ActivityLog.find({ user: req.user.userId, date }).select("activityId");
    return res.status(200).json({
      date,
      completedActivities: entries.map((entry) => entry.activityId),
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch activities.", error: error.message });
  }
};

const toggleActivity = async (req, res) => {
  try {
    const { activityId, date } = req.body;
    if (!activityId) {
      return res.status(400).json({ message: "activityId is required." });
    }

    const resolvedDate = date || dayjs().format("YYYY-MM-DD");
    const existing = await ActivityLog.findOne({ user: req.user.userId, date: resolvedDate, activityId });
    if (existing) {
      await ActivityLog.deleteOne({ _id: existing._id });
      return res.status(200).json({ message: "Activity unmarked.", completed: false, activityId, date: resolvedDate });
    }

    await ActivityLog.create({
      user: req.user.userId,
      date: resolvedDate,
      activityId,
    });
    return res.status(200).json({ message: "Activity marked complete.", completed: true, activityId, date: resolvedDate });
  } catch (error) {
    return res.status(500).json({ message: "Failed to toggle activity.", error: error.message });
  }
};

module.exports = { listActivities, toggleActivity };
