const express = require("express");
const { createJournalEntry, getJournalEntries } = require("../controllers/journalController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getJournalEntries);
router.post("/", protect, createJournalEntry);

module.exports = router;
