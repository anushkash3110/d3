const dayjs = require("dayjs");
const Intervention = require("../../../models/Intervention");
const OnboardingProfile = require("../../../models/OnboardingProfile");
const { getActivityForContext } = require("../../config/activities");
const { recalculateScore } = require("../score/score.service");

const buildAction = (mode) => {
  if (mode === "gentle") return "SHOW_REMINDER";
  if (mode === "lock") return "FORCE_FOCUS";
  return "SHOW_TASK";
};

const buildMessage = ({ mode, appName, continuousMinutes }) => {
  if (mode === "gentle") {
    return `You've been on ${appName} for ${continuousMinutes} minutes. Time for a quick break?`;
  }
  if (mode === "lock") {
    return "Screen time limit reached. Starting a focus session now.";
  }
  return `${continuousMinutes} minutes on ${appName}. Complete this task to continue.`;
};

const triggerIntervention = async (userId, { appName, continuousMinutes, sessionLogId }) => {
  const profile = await OnboardingProfile.findOne({ user: userId });
  const mode = profile?.controlPlan?.interventionMode || "pause";
  const pomodoroMinutes = profile?.controlPlan?.pomodoroWorkMinutes || 25;
  const now = new Date();
  const hour = now.getHours();
  const task = getActivityForContext(hour, mode);

  const intervention = await Intervention.create({
    user: userId,
    date: dayjs(now).format("YYYY-MM-DD"),
    mode,
    triggerApp: appName,
    triggeredAt: now,
    taskAssigned: task.title,
    taskType: task.type,
    status: "pending",
    linkedSessionId: sessionLogId || null,
  });

  const action = buildAction(mode);
  const message = buildMessage({ mode, appName, continuousMinutes });

  return {
    interventionId: intervention._id,
    mode,
    action,
    task,
    message,
    pomodoroMinutes,
  };
};

const completeIntervention = async (interventionId, userId) => {
  const intervention = await Intervention.findOne({ _id: interventionId, user: userId });
  if (!intervention) {
    const error = new Error("Intervention not found.");
    error.statusCode = 404;
    throw error;
  }

  intervention.status = "completed";
  intervention.completedAt = new Date();
  await intervention.save();

  const scoreUpdate = await recalculateScore(userId, dayjs().format("YYYY-MM-DD"));
  return { success: true, scoreUpdate };
};

const skipIntervention = async (interventionId, userId) => {
  const intervention = await Intervention.findOne({ _id: interventionId, user: userId });
  if (!intervention) {
    const error = new Error("Intervention not found.");
    error.statusCode = 404;
    throw error;
  }

  intervention.status = "skipped";
  intervention.overrideUsed = true;
  await intervention.save();

  await recalculateScore(userId, dayjs().format("YYYY-MM-DD"));
  return { success: true };
};

const getPendingIntervention = async (userId) =>
  Intervention.findOne({ user: userId, status: "pending" }).sort({ triggeredAt: -1 });

const getInterventionHistory = async (userId, page = 1, limit = 20) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20));
  const skip = (safePage - 1) * safeLimit;

  const [interventions, total] = await Promise.all([
    Intervention.find({ user: userId }).sort({ triggeredAt: -1 }).skip(skip).limit(safeLimit),
    Intervention.countDocuments({ user: userId }),
  ]);

  return {
    interventions,
    total,
    page: safePage,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
};

module.exports = {
  triggerIntervention,
  completeIntervention,
  skipIntervention,
  getPendingIntervention,
  getInterventionHistory,
};
