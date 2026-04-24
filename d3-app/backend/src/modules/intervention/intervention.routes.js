const express = require("express");
const {
  triggerIntervention,
  completeIntervention,
  skipIntervention,
  getPendingIntervention,
  getInterventionHistory,
} = require("./intervention.controller");

const router = express.Router();

router.post("/trigger", triggerIntervention);
router.patch("/:id/complete", completeIntervention);
router.patch("/:id/skip", skipIntervention);
router.get("/pending", getPendingIntervention);
router.get("/history", getInterventionHistory);

module.exports = router;
