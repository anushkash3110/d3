const cors = require("cors");
const express = require("express");
const { protect } = require("../middleware/authMiddleware");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).json({ message: "Digital Dopamine Detox backend running." });
});

app.use("/api/auth", require("../routes/authRoutes"));
app.use("/api/onboarding", require("../routes/onboardingRoutes"));
app.use("/api/screen-time", require("../routes/screenTimeRoutes"));
app.use("/api/activities", require("../routes/activityRoutes"));
app.use("/api/focus-sessions", require("../routes/focusSessionRoutes"));
app.use("/api/interventions", require("../routes/interventionRoutes"));
app.use("/api/journal", require("../routes/journalRoutes"));
app.use("/api/dashboard", require("../routes/dashboardRoutes"));
app.use("/api/v1/dev", require("./modules/dev/dev.routes"));
app.use("/api/v1/score", protect, require("./modules/score/score.routes"));
app.use("/api/v1/interventions", protect, require("./modules/intervention/intervention.routes"));
app.use("/api/v1/mirror", protect, require("./modules/mirror/mirror.routes"));

app.use((req, res) => {
  res.status(404).json({ message: "Route not found." });
});

module.exports = app;
