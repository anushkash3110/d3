const express = require("express");
const { reset, seed } = require("./dev.controller");

const router = express.Router();

router.post("/seed", seed);
router.post("/reset", reset);

module.exports = router;
