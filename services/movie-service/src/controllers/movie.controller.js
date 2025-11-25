// src/controllers/movie.controller.js
const express = require("express");
const router = express.Router();
const movieService = require("../services/impl/movie.service.impl");

const {
  requireManagerOrAdmin,
} = require("../security/auth-checker.middleware");

// =========================
//  1. TMDB SYNC (ADMIN/MANAGER)
// =========================
router.post("/sync", requireManagerOrAdmin, async (req, res) => {
  try {
    const result = await movieService.syncMovies();
    res.json({
      message: "Movies synced successfully!",
      ...result,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// =========================
//  2. PUBLIC LIST
// =========================

// now playing
router.get("/now-playing", async (req, res) => {
  try {
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);
    const data = await movieService.getNowPlayingMovies(page, size);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);
    const data = await movieService.getUpcomingMovies(page, size);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// archived (manager/admin)
router.get("/archived", requireManagerOrAdmin, async (req, res) => {
  try {
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);
    const data = await movieService.getArchivedMovies(page, size);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// =========================
//  3. SEARCH
// =========================

// Giữ endpoint cũ /search cho chắc
router.get("/search", async (req, res) => {
  try {
    const keyword = req.query.keyword;
    const data = await movieService.searchMovies(keyword);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

// =========================
//  4. ADMIN SEARCH / PUBLIC SEARCH TƯƠNG THÍCH FE
// =========================
//
// FE của bạn có thể đang gọi: GET /api/movies?keyword=xxx
// --> Nếu chỉ có keyword, không có status/page/size & không có role manager/admin
//     => coi như public search.
// --> Nếu có status/page/size hoặc role MANAGER/ADMIN
//     => dùng adminSearch như Java.
//
router.get("/", async (req, res) => {
  try {
    const { keyword, status } = req.query;
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);

    const hasPagingOrStatus =
      typeof req.query.page !== "undefined" ||
      typeof req.query.size !== "undefined" ||
      typeof status !== "undefined";

    const ctx = req.userContext;
    const role = ctx?.role?.toUpperCase?.() || "";
    const isManagerOrAdmin = role === "MANAGER" || role === "ADMIN";

    // Trường hợp FE chưa login, chỉ gửi ?keyword=...
    if (keyword && !hasPagingOrStatus && !isManagerOrAdmin) {
      const data = await movieService.searchMovies(keyword);
      return res.json(data);
    }

    // Còn lại: yêu cầu quyền manager/admin giống Java
    if (!isManagerOrAdmin) {
      return res
        .status(403)
        .json({ message: "Manager or Admin access required" });
    }

    const data = await movieService.adminSearch(keyword, status, page, size);
    return res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

// =========================
//  5. DETAIL – TƯƠNG THÍCH VỚI FE
// =========================
//
// FE ĐANG GỌI: GET /api/movies/1054867
// --> 1054867 là TMDb ID (số)
// Java thì có 2 endpoint:
//   - /tmdb/{tmdbId}
//   - /{id} (UUID)
//
// Ở đây mình hỗ trợ cả 2 trong cùng 1 route:
//   - Nếu param toàn số --> xem là tmdbId
//   - Nếu param là UUID --> xem là id trong DB
//
router.get("/tmdb/:tmdbId", async (req, res) => {
  // giữ endpoint cũ cho chắc
  try {
    const tmdbId = Number(req.params.tmdbId);
    const data = await movieService.getMovieDetail(tmdbId);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(404).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const raw = req.params.id;

    // Nếu toàn là số -> xem là tmdbId (FE đang dùng kiểu này)
    if (/^\d+$/.test(raw)) {
      const tmdbId = Number(raw);
      const data = await movieService.getMovieDetail(tmdbId);
      return res.json(data);
    }

    // Còn lại -> coi là UUID
    const data = await movieService.getMovieByUuid(raw);
    return res.json(data);
  } catch (e) {
    console.error(e);
    res.status(404).json({ message: e.message });
  }
});

// =========================
//  6. UPDATE / DELETE / CHANGE STATUS (MANAGER/ADMIN)
// =========================

router.put("/:id", requireManagerOrAdmin, async (req, res) => {
  try {
    const data = await movieService.updateMovie(req.params.id, req.body);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

router.delete("/:id", requireManagerOrAdmin, async (req, res) => {
  try {
    await movieService.deleteMovie(req.params.id);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(404).json({ message: e.message });
  }
});

router.post("/:id/status", requireManagerOrAdmin, async (req, res) => {
  try {
    await movieService.changeStatus(req.params.id, req.body.status);
    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});

module.exports = router;
