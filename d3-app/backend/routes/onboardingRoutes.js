const express = require("express");
const { getOnboardingProfile, upsertOnboardingProfile } = require("../controllers/onboardingController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getOnboardingProfile);
router.put("/", protect, upsertOnboardingProfile);

module.exports = router;
