const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { completeIntervention, skipIntervention } = require("../controllers/interventionController");

const router = express.Router();

router.patch("/:id/complete", protect, completeIntervention);
router.patch("/:id/skip", protect, skipIntervention);

module.exports = router;
