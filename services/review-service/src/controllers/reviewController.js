const express = require("express");
const router = express.Router();
const reviewService = require("../services/reviewService");
const {
  requireAuthenticated,
  requireManagerOrAdmin,
} = require("../middlewares/auth");

// POST /api/reviews
router.post("/", requireAuthenticated, async (req, res) => {
  try {
    req.body.userId = req.user.userId;
    const review = await reviewService.createReview(req.body);
    res.json(review);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PUT /api/reviews/:id
router.put("/:id", requireAuthenticated, async (req, res) => {
  try {
    req.body.userId = req.user.userId;
    const review = await reviewService.updateReview(req.params.id, req.body);
    res.json(review);
  } catch (err) {
    const status = err.message === "Review not found" ? 404 : 400;
    res.status(status).json({ message: err.message });
  }
});

// DELETE /api/reviews/:id
router.delete("/:id", requireAuthenticated, async (req, res) => {
  try {
    await reviewService.deleteReview(req.params.id);
    res.status(204).end();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reviews/movie/:movieId
router.get("/movie/:movieId", async (req, res) => {
  try {
    const reviews = await reviewService.getReviewsByMovie(req.params.movieId);
    res.json(reviews);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reviews/movie/:movieId/average-rating
router.get("/movie/:movieId/average-rating", async (req, res) => {
  try {
    const avg = await reviewService.getAverageRating(req.params.movieId);
    res.json(avg);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// POST /api/reviews/:id/report
router.post("/:id/report", requireAuthenticated, async (req, res) => {
  try {
    const review = await reviewService.reportReview(req.params.id);
    res.json(review);
  } catch (err) {
    const status = err.message === "Review not found" ? 404 : 400;
    res.status(status).json({ message: err.message });
  }
});

// POST /api/reviews/:id/hide
router.post("/:id/hide", requireManagerOrAdmin, async (req, res) => {
  try {
    const review = await reviewService.hideReview(req.params.id);
    res.json(review);
  } catch (err) {
    const status = err.message === "Review not found" ? 404 : 400;
    res.status(status).json({ message: err.message });
  }
});

// POST /api/reviews/movie/:movieId/rate
router.post("/movie/:movieId/rate", requireAuthenticated, async (req, res) => {
  try {
    const userId = req.user.userId;
    const rating = await reviewService.upsertRating(
      req.params.movieId,
      req.body,
      userId
    );
    res.json(rating);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/reviews/movie/:movieId/my-rating
router.get(
  "/movie/:movieId/my-rating",
  requireAuthenticated,
  async (req, res) => {
    try {
      const rating = await reviewService.getMyRating(
        req.params.movieId,
        req.user.userId
      );
      if (!rating) {
        return res.status(204).end();
      }
      res.json(rating);
    } catch (err) {
      res.status(400).json({ message: err.message });
    }
  }
);

module.exports = router;
