const axios = require("axios");
const config = require("../config");
const reviewModel = require("../models/reviewModel");

// Gọi sang Booking Service để kiểm tra user đã đặt vé cho movie chưa
// async function hasUserBookedMovie(movieId, userId) {
//   // 1) Cho phép bypass khi dev/demo
//   if (String(process.env.BYPASS_BOOKING_CHECK).toLowerCase() === "true") {
//     return true;
//   }

//   try {
//     // bookingServiceUrl ví dụ trong docker: http://booking-service:8085
//     const url = `${config.bookingServiceUrl}/bookings/check`;

//     const response = await axios.get(url, {
//       params: { userId, movieId },
//       headers: {
//         // 2) Header nội bộ phải KHỚP giữa service
//         // Bạn đang dùng X-Internal-Secret ở các chỗ khác -> giữ 1 chuẩn
//         "X-Internal-Secret": config.internalSecret,
//       },
//       timeout: 5000,
//     });

//     // booking-service nên trả true/false hoặc {data:true}
//     const data = response.data;
//     if (typeof data === "boolean") return data;
//     if (typeof data?.result === "boolean") return data.result;
//     if (typeof data?.data === "boolean") return data.data;

//     return Boolean(data);
//   } catch (err) {
//     console.error("Error calling BookingService:", err.message || err);
//     throw new Error("Failed to connect to BookingService");
//   }
// }

//TẠM THỜI: cho luôn là user đã đặt vé để test
async function hasUserBookedMovie(movieId, userId) {
  return true;
}

// validate rating 1–5 sao
function validateRating(r) {
  const n = Number(r);
  if (!Number.isFinite(n)) throw new Error("rating phải là number");
  if (n < 1 || n > 5) throw new Error("rating phải từ 1 đến 5");
  return n;
}

async function createReview(body) {
  const { movieId, userId, fullName, avatarUrl, rating, comment } = body;

  // chỉ coi là có rating nếu Number(rating) là số hữu hạn
  const ratingNum = Number(rating);
  const hasRating = Number.isFinite(ratingNum);

  const ratingValue = hasRating ? validateRating(ratingNum) : null;

  const allowed = await hasUserBookedMovie(movieId, userId);
  if (!allowed) throw new Error("User chưa xem phim này, không thể review!");

  return await reviewModel.createReview({
    movieId,
    userId,
    fullName,
    avatarUrl,
    rating: ratingValue,
    comment,
  });
}

async function updateReview(id, body) {
  const existing = await reviewModel.findById(id);
  if (!existing) throw new Error("Review not found");

  const ratingValue =
    body.rating === undefined || body.rating === null || body.rating === ""
      ? existing.rating
      : validateRating(body.rating);

  if (String(existing.userId) !== String(body.userId))
    throw new Error("Forbidden");

  const allowed = await hasUserBookedMovie(existing.movieId, existing.userId);
  if (!allowed)
    throw new Error("User chưa xem phim này, không thể sửa review!");

  return await reviewModel.updateReview(id, {
    rating: ratingValue,
    comment: body.comment,
  });
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

  const ratingValue = validateRating(rating);

  const allowed = await hasUserBookedMovie(movieId, userId);
  if (!allowed) {
    throw new Error("User chưa xem phim này, không thể rating!");
  }

  const review = await reviewModel.upsertRating({
    movieId,
    userId,
    fullName,
    avatarUrl,
    rating: ratingValue,
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
