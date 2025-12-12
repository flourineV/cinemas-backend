const axios = require("axios");
const config = require("../config");
const reviewModel = require("../models/reviewModel");

// TẠM THỜI: cho luôn là user đã đặt vé để test
async function hasUserBookedMovie(movieId, userId) {
  // TODO: sau này nối với booking-service thật
  return true;
}

// validate rating 1–5 sao
function validateRating(rating) {
  if (typeof rating !== "number") {
    throw new Error("rating phải là number");
  }
  if (rating < 1 || rating > 5) {
    throw new Error("rating phải từ 1 đến 5");
  }
}

async function createReview(body) {
  const { movieId, userId, fullName, avatarUrl, rating, comment } = body;

  validateRating(rating);

  const allowed = await hasUserBookedMovie(movieId, userId);
  if (!allowed) {
    throw new Error("User chưa xem phim này, không thể review!");
  }

  const review = await reviewModel.createReview({
    movieId,
    userId,
    fullName,
    avatarUrl,
    rating,
    comment,
  });

  return review;
}

async function updateReview(id, body) {
  const existing = await reviewModel.findById(id);
  if (!existing) {
    throw new Error("Review not found");
  }

  const allowed = await hasUserBookedMovie(existing.movieId, existing.userId);
  if (!allowed) {
    throw new Error("User chưa xem phim này, không thể sửa review!");
  }

  validateRating(body.rating);

  const updated = await reviewModel.updateReview(id, {
    rating: body.rating,
    comment: body.comment,
  });
  return updated;
}

async function deleteReview(id) {
  await reviewModel.deleteReview(id);
}

async function getReviewsByMovie(movieId) {
  return reviewModel.findByMovieAndStatus(movieId, "VISIBLE");
}

async function getAverageRating(movieId) {
  return reviewModel.findAverageRatingByMovie(movieId);
}

async function reportReview(id) {
  const existing = await reviewModel.findById(id);
  if (!existing) {
    throw new Error("Review not found");
  }
  return reviewModel.setReported(id, true);
}

async function hideReview(id) {
  const existing = await reviewModel.findById(id);
  if (!existing) {
    throw new Error("Review not found");
  }
  return reviewModel.setStatus(id, "HIDDEN");
}

// UPSERT rating
async function upsertRating(movieId, body, userIdFromAuth) {
  const userId = userIdFromAuth || body.userId;
  const { fullName, avatarUrl, rating } = body;

  validateRating(rating);

  const allowed = await hasUserBookedMovie(movieId, userId);
  if (!allowed) {
    throw new Error("User chưa xem phim này, không thể rating!");
  }

  const review = await reviewModel.upsertRating({
    movieId,
    userId,
    fullName,
    avatarUrl,
    rating,
  });

  return {
    id: review.id,
    movieId: review.movieId,
    userId: review.userId,
    fullName: review.fullName,
    avatarUrl: review.avatarUrl,
    rating: review.rating,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

async function getMyRating(movieId, userId) {
  const review = await reviewModel.findByMovieAndUser(movieId, userId);
  if (!review) return null;
  return {
    id: review.id,
    movieId: review.movieId,
    userId: review.userId,
    fullName: review.fullName,
    avatarUrl: review.avatarUrl,
    rating: review.rating,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  };
}

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  getReviewsByMovie,
  getAverageRating,
  reportReview,
  hideReview,
  upsertRating,
  getMyRating,
};
