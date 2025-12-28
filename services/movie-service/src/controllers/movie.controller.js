// src/controllers/movie.controller.js
const express = require("express");
const router = express.Router();
const movieService = require("../services/impl/movie.service.impl");
const {
  requireInternal,
} = require("../security/internal-auth-checker.middleware");
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
// Java compatibility: POST /api/movies/bulk-from-tmdb
router.post("/bulk-from-tmdb", requireManagerOrAdmin, async (req, res) => {
  try {
    const result = await movieService.syncMovies();
    return res
      .status(201)
      .json({ message: "Movies synced successfully!", ...result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
  }
});

// =========================
//  2. PUBLIC LIST
// =========================

// now playing
router.get("/now-playing", async (req, res) => {
  try {
    const lang = req.headers["accept-language"];
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);
    const data = await movieService.getNowPlayingMovies(page, size, lang);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

// upcoming
router.get("/upcoming", async (req, res) => {
  try {
    const lang = req.headers["accept-language"];
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);
    const data = await movieService.getUpcomingMovies(page, size, lang);
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
// router.get("/search", async (req, res) => {
//   try {
//     const keyword = req.query.keyword;
//     const data = await movieService.searchMovies(keyword);
//     res.json(data);
//   } catch (e) {
//     console.error(e);
//     res.status(400).json({ message: e.message });
//   }
// });
router.get("/search", async (req, res) => {
  try {
    const lang = req.headers["accept-language"];
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 10);

    // FE gửi "title", mình hỗ trợ luôn các tên khác cho chắc
    let keyword =
      req.query.keyword || req.query.title || req.query.q || req.query.query;

    if (!keyword || keyword.trim() === "") {
      return res.status(400).json({ message: "Title parameter is required" });
    }

    // Dùng adminSearch để có paging (search theo title)
    const result = await movieService.adminSearch(
      keyword,
      null,
      page,
      size,
      lang
    );

    // Trả đúng kiểu FE mong đợi: { content: MovieSummary[] }
    return res.json({
      content: result.data,
      page: result.page,
      size: result.size,
      totalElements: result.totalElements,
      totalPages: result.totalPages,
    });
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
// GET /api/movies/advanced-search (MANAGER/ADMIN)
router.get("/advanced-search", requireManagerOrAdmin, async (req, res) => {
  try {
    const { keyword, status } = req.query;

    const lang = req.headers["accept-language"];
    const page1 = Number(req.query.page || 1);
    const size = Number(req.query.size || 10);
    const page0 = Math.max(0, page1 - 1);

    const data = await movieService.adminSearch(
      keyword,
      status,
      page0,
      size,
      lang
    );
    return res.json(data);
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message });
  }
});

router.get("/", async (req, res) => {
  try {
    let { keyword, status } = req.query;
    const page = Number(req.query.page || 0);
    const size = Number(req.query.size || 20);
    const lang = req.headers["accept-language"];
    const ctx = req.userContext;
    const role = ctx?.role?.toUpperCase?.() || "";
    const isManagerOrAdmin = role === "MANAGER" || role === "ADMIN";

    // Trường hợp FE chưa login, chỉ gửi ?keyword=...
    // if (keyword && !hasPagingOrStatus && !isManagerOrAdmin) {
    keyword = keyword || req.query.title || req.query.q || req.query.query;

    // ------ USER THƯỜNG / CHƯA LOGIN: PUBLIC SEARCH ------
    if (!isManagerOrAdmin) {
      if (!keyword || keyword.trim() === "") {
        return res.status(400).json({ message: "Title parameter is required" });
      }
      const data = await movieService.searchMovies(keyword, lang);
      return res.json(data);
    }

    // Còn lại: yêu cầu quyền manager/admin giống Java
    // if (!isManagerOrAdmin) {
    //   return res
    //     .status(403)
    //     .json({ message: "Manager or Admin access required" });
    // }

    const data = await movieService.adminSearch(
      keyword,
      status,
      page,
      size,
      lang
    );
    return res.json(data);
  } catch (e) {
    console.error(e);
    res.status(400).json({ message: e.message });
  }
});
// POST /api/movies/update-status (MANAGER/ADMIN)
router.post("/update-status", requireManagerOrAdmin, async (req, res) => {
  try {
    // Nếu bạn đã có scheduler/service tương tự Java thì gọi ở đây
    const result = await movieService.updateAllMovieStatuses?.();

    // Nếu chưa làm, trả response giống Java để admin UI không vỡ
    if (!result) {
      return res.json({
        upcomingToNowPlaying: 0,
        nowPlayingToArchived: 0,
        message: "Movie statuses updated successfully",
      });
    }

    return res.json({
      upcomingToNowPlaying: result.upcomingToNowPlaying || 0,
      nowPlayingToArchived: result.nowPlayingToArchived || 0,
      message: "Movie statuses updated successfully",
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: e.message });
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
    const lang = req.headers["accept-language"];
    const tmdbId = Number(req.params.tmdbId);
    const data = await movieService.getMovieDetail(tmdbId, lang);
    res.json(data);
  } catch (e) {
    console.error(e);
    res.status(404).json({ message: e.message });
  }
});
router.get("/available-for-range", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const lang = req.headers["accept-language"];
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "startDate and endDate are required" });
    }

    const iso = /^\d{4}-\d{2}-\d{2}$/;
    if (!iso.test(startDate) || !iso.test(endDate)) {
      return res.status(400).json({ message: "Dates must be YYYY-MM-DD" });
    }

    const data = await movieService.getAvailableMoviesForDateRange(
      startDate,
      endDate,
      lang
    );
    return res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});
//Thêm
// POST /api/movies/:id/set-now-playing (internal)
router.post("/:id/set-now-playing", requireInternal, async (req, res) => {
  try {
    await movieService.changeStatus(req.params.id, "NOW_PLAYING");
    return res.status(204).send();
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message });
  }
});

// POST /api/movies/batch/titles (internal)
router.post("/batch/titles", requireInternal, async (req, res) => {
  try {
    const ids = req.body; // array uuid
    const lang = req.headers["accept-language"];
    const map = await movieService.getBatchMovieTitles(ids, lang);
    return res.json(map);
  } catch (e) {
    console.error(e);
    return res.status(400).json({ message: e.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const lang = req.headers["accept-language"];
    const raw = req.params.id;

    // Nếu toàn là số -> xem là tmdbId (FE đang dùng kiểu này)
    if (/^\d+$/.test(raw)) {
      const tmdbId = Number(raw);
      const data = await movieService.getMovieDetail(tmdbId, lang);
      return res.json(data);
    }

    // Còn lại -> coi là UUID
    const data = await movieService.getMovieByUuid(raw, lang);
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
