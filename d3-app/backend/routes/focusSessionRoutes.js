const express = require("express");
const { createFocusSession, getFocusSessions, updateFocusSession } = require("../controllers/focusSessionController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getFocusSessions);
router.post("/", protect, createFocusSession);
router.patch("/:id", protect, updateFocusSession);

module.exports = router;
