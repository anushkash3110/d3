const express = require("express");
const { getMirrorAnalysis, refreshMirrorAnalysis } = require("./mirror.controller");

const router = express.Router();

router.get("/analysis", getMirrorAnalysis);
router.get("/analysis/refresh", refreshMirrorAnalysis);

module.exports = router;
