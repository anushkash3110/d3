const MirrorCache = require("../../../models/MirrorCache");
const { generateMirrorAnalysis } = require("./mirror.service");

const SIX_HOURS_MS = 6 * 60 * 60 * 1000;
const getUserId = (req) => req.user?.id || req.user?.userId;

const formatAnalysisError = () => ({
  success: false,
  message: "Could not generate analysis. Try again.",
  error: {
    code: "ANALYSIS_FAILED",
    message: "Could not generate analysis. Try again.",
  },
});

const getCachedAnalysis = async (userId) => {
  const cached = await MirrorCache.findOne({ userId });
  if (!cached) return null;
  const isFresh = Date.now() - new Date(cached.generatedAt).getTime() < SIX_HOURS_MS;
  if (!isFresh) return null;
  return cached.analysis;
};

const upsertCache = async (userId, analysis) => {
  await MirrorCache.findOneAndUpdate(
    { userId },
    { userId, analysis, generatedAt: new Date() },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
};

const getMirrorAnalysis = async (req, res) => {
  try {
    const userId = getUserId(req);
    const cached = await getCachedAnalysis(userId);
    if (cached) {
      return res.status(200).json({ success: true, data: cached });
    }

    try {
      const analysis = await generateMirrorAnalysis(userId);
      await upsertCache(userId, analysis);
      return res.status(200).json({ success: true, data: analysis });
    } catch (error) {
      console.error("Mirror analysis generation failed:", error);
      if (error instanceof SyntaxError) {
        return res.status(500).json(formatAnalysisError());
      }
      return res.status(500).json(formatAnalysisError());
    }
  } catch (error) {
    return res.status(500).json(formatAnalysisError());
  }
};

const refreshMirrorAnalysis = async (req, res) => {
  try {
    const userId = getUserId(req);
    try {
      const analysis = await generateMirrorAnalysis(userId);
      await upsertCache(userId, analysis);
      return res.status(200).json({ success: true, data: analysis });
    } catch (error) {
      console.error("Mirror analysis refresh failed:", error);
      if (error instanceof SyntaxError) {
        return res.status(500).json(formatAnalysisError());
      }
      return res.status(500).json(formatAnalysisError());
    }
  } catch (error) {
    return res.status(500).json(formatAnalysisError());
  }
};

module.exports = { getMirrorAnalysis, refreshMirrorAnalysis };
