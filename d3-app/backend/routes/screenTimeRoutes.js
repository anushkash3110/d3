const express = require("express");
const { endScreenTimeSession, getScreenTimeHistory, upsertScreenTime } = require("../controllers/screenTimeController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getScreenTimeHistory);
router.post("/", protect, upsertScreenTime);
router.patch("/session/:id/end", protect, endScreenTimeSession);

module.exports = router;
