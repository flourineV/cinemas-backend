import { pool } from "./db";

export async function upsertRating(
  tmdbId: number,
  rating: number,
  comment?: string,
  userId?: string
) {
  // Nếu có userId: update nếu đã tồn tại
  if (userId) {
    const sql = `
      INSERT INTO movie_ratings (tmdb_id, user_id, rating, comment)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (tmdb_id, user_id)
      DO UPDATE SET rating = EXCLUDED.rating,
                    comment = EXCLUDED.comment,
                    updated_at = now()
      RETURNING *;
    `;
    const { rows } = await pool.query(sql, [
      tmdbId,
      userId,
      rating,
      comment ?? null,
    ]);
    return rows[0];
  }

  // Không có userId: cứ insert
  const { rows } = await pool.query(
    `INSERT INTO movie_ratings (tmdb_id, rating, comment)
     VALUES ($1, $2, $3)
     RETURNING *;`,
    [tmdbId, rating, comment ?? null]
  );
  return rows[0];
}

export async function listRatings(tmdbId: number, limit = 50, offset = 0) {
  const { rows } = await pool.query(
    `SELECT id, rating, comment, created_at
     FROM movie_ratings
     WHERE tmdb_id = $1
     ORDER BY created_at DESC
     LIMIT $2 OFFSET $3;`,
    [tmdbId, limit, offset]
  );
  return rows;
}

export async function getRatingSummary(tmdbId: number) {
  const { rows } = await pool.query(
    `SELECT COALESCE(AVG(rating),0)::float AS average,
            COUNT(*)::int AS count
     FROM movie_ratings
     WHERE tmdb_id = $1;`,
    [tmdbId]
  );
  return rows[0]; // { average, count }
}
