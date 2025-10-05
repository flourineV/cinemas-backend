import { pool } from "./db";

export async function upsertGenres(genres: { id: number; name: string }[]) {
  if (!genres?.length) return;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const g of genres) {
      await client.query(
        `INSERT INTO genres(id,name) VALUES($1,$2)
         ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name`,
        [g.id, g.name]
      );
    }
    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

export const getAllGenres = async () => {
  const { rows } = await pool.query(`SELECT id,name FROM genres ORDER BY name`);
  return rows as { id: number; name: string }[];
};

export async function getGenreNameMap(): Promise<Record<number, string>> {
  const { rows } = await pool.query("SELECT id, name FROM genres");
  const map: Record<number, string> = {};
  for (const r of rows) map[r.id] = r.name;
  return map;
}
export async function listByGenres(
  genreIds: number[],
  page: number,
  size: number
): Promise<{ rows: any[]; total: number }> {
  const limit = Math.max(1, Number(size) || 10);
  const offset = Math.max(0, Number(page) || 0) * limit;

  // Đếm tổng
  const totalSql = `
    SELECT COUNT(DISTINCT m.id)::int AS total
    FROM movies m
    JOIN movie_genres mg ON mg.movie_id = m.id
    WHERE mg.genre_id = ANY($1)
  `;
  const totalRes = await pool.query(totalSql, [genreIds]);
  const total = totalRes.rows[0]?.total ?? 0;

  // Lấy danh sách (shape khớp FE: posterUrl, genres: string[], time, spokenLanguages, age, trailer, voteAverage...)
  const listSql = `
    SELECT
      m.tmdb_id                               AS "tmdbId",
      m.title,
      m.poster_path                           AS "posterUrl",
      COALESCE(m.runtime, NULL)               AS "time",
      COALESCE(m.spoken_languages, '{}')      AS "spokenLanguages",
      COALESCE(m.age_certification, NULL)     AS "age",
      COALESCE(m.trailer_url, NULL)           AS "trailer",
      COALESCE(m.vote_average, NULL)          AS "voteAverage",
      ARRAY_AGG(DISTINCT g.name ORDER BY g.name) AS "genres"
    FROM movies m
    JOIN movie_genres mg ON mg.movie_id = m.id
    JOIN genres g        ON g.id = mg.genre_id
    WHERE mg.genre_id = ANY($1)
    GROUP BY m.id
    ORDER BY COALESCE(m.popularity,0) DESC, m.release_date DESC NULLS LAST
    LIMIT $2 OFFSET $3
  `;
  const listRes = await pool.query(listSql, [genreIds, limit, offset]);

  return { rows: listRes.rows, total };
}
