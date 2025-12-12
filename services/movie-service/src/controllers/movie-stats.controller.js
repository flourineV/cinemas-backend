// src/controllers/movie-stats.controller.js

const express = require("express");
const router = express.Router();
const movieStatsService = require("../services/movie-stats.service");

// Tạm thời CHƯA check AuthChecker, để port sau
// GET /api/movies/stats/overview
router.get("/overview", async (req, res) => {
  try {
    const data = await movieStatsService.getOverview();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// GET /api/movies/stats/monthly
router.get("/monthly", async (req, res) => {
  try {
    const data = await movieStatsService.getMonthlyStats();
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
