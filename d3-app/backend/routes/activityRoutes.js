const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { listActivities, toggleActivity } = require("../controllers/activityController");

const router = express.Router();

router.get("/", protect, listActivities);
router.post("/toggle", protect, toggleActivity);

module.exports = router;
