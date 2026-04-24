const express = require("express");
const { getDashboardAnalytics } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/analytics", protect, getDashboardAnalytics);

module.exports = router;
