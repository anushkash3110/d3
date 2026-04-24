const User = require("../models/User");

const upsertOnboardingProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profilePayload = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {
        onboardingProfile: profilePayload,
        onboardingCompleted: true,
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      message: "Onboarding profile saved.",
      profile: user.onboardingProfile,
      onboardingCompleted: user.onboardingCompleted,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to save onboarding profile.", error: error.message });
  }
};

const getOnboardingProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("onboardingProfile onboardingCompleted");
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    return res.status(200).json({
      profile: user.onboardingProfile,
      onboardingCompleted: user.onboardingCompleted,
    });
  } catch (error) {
    return res.status(500).json({ message: "Failed to fetch onboarding profile.", error: error.message });
  }
};

module.exports = { upsertOnboardingProfile, getOnboardingProfile };
