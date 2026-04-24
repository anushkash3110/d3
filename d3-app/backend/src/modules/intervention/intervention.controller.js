const interventionService = require("./intervention.service");

const getUserId = (req) => req.user?.id || req.user?.userId;

const triggerIntervention = async (req, res) => {
  try {
    const userId = getUserId(req);
    const { appName, continuousMinutes, sessionLogId } = req.body || {};
    if (!appName || continuousMinutes === undefined) {
      return res.status(400).json({ message: "appName and continuousMinutes are required." });
    }

    const result = await interventionService.triggerIntervention(userId, { appName, continuousMinutes, sessionLogId });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to trigger intervention.", error: error.message });
  }
};

const completeIntervention = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await interventionService.completeIntervention(req.params.id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to complete intervention.", error: error.message });
  }
};

const skipIntervention = async (req, res) => {
  try {
    const userId = getUserId(req);
    const result = await interventionService.skipIntervention(req.params.id, userId);
    return res.status(200).json(result);
  } catch (error) {
    if (error.statusCode === 404) {
      return res.status(404).json({ message: error.message });
    }
    return res.status(500).json({ message: "Failed to skip intervention.", error: error.message });
  }
};

const getPendingIntervention = async (req, res) => {
  try {
    const userId = getUserId(req);
    const intervention = await interventionService.getPendingIntervention(userId);
    return res.status(200).json({ intervention });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch pending intervention.", error: error.message });
  }
};

const getInterventionHistory = async (req, res) => {
  try {
    const userId = getUserId(req);
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await interventionService.getInterventionHistory(userId, page, limit);
    return res.status(200).json(result);
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch intervention history.", error: error.message });
  }
};

module.exports = {
  triggerIntervention,
  completeIntervention,
  skipIntervention,
  getPendingIntervention,
  getInterventionHistory,
};
