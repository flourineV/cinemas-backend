const db = require("../db");

function mapReviewRow(row) {
  if (!row) return null;
  return {
    id: row.id,
    movieId: row.movie_id,
    userId: row.user_id,
    fullName: row.full_name,
    avatarUrl: row.avatar_url,
    rating: row.rating,
    comment: row.comment,
    status: row.status,
    reported: row.reported,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createReview({
  movieId,
  userId,
  fullName,
  avatarUrl,
  rating,
  comment,
}) {
  const result = await db.query(
    `INSERT INTO reviews
     (movie_id, user_id, full_name, avatar_url, rating, comment, status, reported, created_at, updated_at)
     VALUES ($1,$2,$3,$4,$5,$6,'VISIBLE',FALSE,NOW(),NOW())
     RETURNING *`,
    [movieId, userId, fullName, avatarUrl, rating, comment]
  );
  return mapReviewRow(result.rows[0]);
}

async function updateReview(id, { rating, comment }) {
  const result = await db.query(
    `UPDATE reviews
     SET rating = $2,
         comment = $3,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, rating, comment]
  );
  return mapReviewRow(result.rows[0]);
}

async function deleteReview(id) {
  await db.query("DELETE FROM reviews WHERE id = $1", [id]);
}

async function findById(id) {
  const result = await db.query("SELECT * FROM reviews WHERE id = $1", [id]);
  return mapReviewRow(result.rows[0]);
}

async function findByMovieAndStatus(movieId, status) {
  const result = await db.query(
    `SELECT * FROM reviews
     WHERE movie_id = $1 AND status = $2
     ORDER BY created_at DESC`,
    [movieId, status]
  );
  return result.rows.map(mapReviewRow);
}

async function findAverageRatingByMovie(movieId) {
  const result = await db.query(
    `SELECT AVG(rating) AS avg_rating
     FROM reviews
     WHERE movie_id = $1 AND status = 'VISIBLE'`,
    [movieId]
  );
  const value = result.rows[0]?.avg_rating;
  return value === null || value === undefined ? 0 : Number(value);
}

async function findByMovieAndUser(movieId, userId) {
  const result = await db.query(
    `SELECT * FROM reviews
     WHERE movie_id = $1 AND user_id = $2
     LIMIT 1`,
    [movieId, userId]
  );
  return mapReviewRow(result.rows[0]);
}

async function setReported(id, reported) {
  const result = await db.query(
    `UPDATE reviews
     SET reported = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, reported]
  );
  return mapReviewRow(result.rows[0]);
}

async function setStatus(id, status) {
  const result = await db.query(
    `UPDATE reviews
     SET status = $2,
         updated_at = NOW()
     WHERE id = $1
     RETURNING *`,
    [id, status]
  );
  return mapReviewRow(result.rows[0]);
}

async function upsertRating({ movieId, userId, fullName, avatarUrl, rating }) {
  const existing = await findByMovieAndUser(movieId, userId);

  if (existing) {
    const result = await db.query(
      `UPDATE reviews
       SET rating = $3,
           full_name = COALESCE($4, full_name),
           avatar_url = COALESCE($5, avatar_url),
           updated_at = NOW()
       WHERE movie_id = $1 AND user_id = $2
       RETURNING *`,
      [movieId, userId, rating, fullName, avatarUrl]
    );
    return mapReviewRow(result.rows[0]);
  } else {
    const result = await db.query(
      `INSERT INTO reviews
       (movie_id, user_id, full_name, avatar_url, rating, comment, status, reported, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,NULL,'VISIBLE',FALSE,NOW(),NOW())
       RETURNING *`,
      [movieId, userId, fullName, avatarUrl, rating]
    );
    return mapReviewRow(result.rows[0]);
  }
}

module.exports = {
  createReview,
  updateReview,
  deleteReview,
  findById,
  findByMovieAndStatus,
  findAverageRatingByMovie,
  findByMovieAndUser,
  setReported,
  setStatus,
  upsertRating,
};
