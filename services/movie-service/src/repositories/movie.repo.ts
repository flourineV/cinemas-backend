// src/repositories/movie.repo.ts
import { pool } from "./db";

type MovieRecord = {
  tmdb_id: number;
  title: string;
  original_title?: string | null;
  overview?: string | null;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  runtime?: number | null;
  popularity?: number | null;
  vote_average?: number | null;
  vote_count?: number | null;
  status?: string | null;
  language?: string | null;
  spoken_languages?: string[];
  production_countries?: string[];
  cast_names?: string[];
  crew_names?: string[];
  trailer_url?: string | null;
  age_certification?: string | null;
  genres: { id: number; name: string }[];
};

export async function upsertMovie(m: MovieRecord) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    // bảo đảm genres có trong bảng genres
    for (const g of m.genres) {
      await client.query(
        `INSERT INTO genres(id,name) VALUES($1,$2)
         ON CONFLICT(id) DO UPDATE SET name=EXCLUDED.name`,
        [g.id, g.name]
      );
    }

    // 19 cột ↔ 19 values ($1..$19)
    const up = await client.query(
      `
      INSERT INTO movies(
        tmdb_id, title, original_title, overview, poster_path, backdrop_path, release_date,
        runtime, popularity, vote_average, vote_count, status, language,
        spoken_languages, production_countries, cast_names, crew_names, trailer_url, age_certification
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,
        $8,$9,$10,$11,$12,$13,
        $14,$15,$16,$17,$18,$19
      )
      ON CONFLICT (tmdb_id) DO UPDATE SET
        title=EXCLUDED.title,
        original_title=EXCLUDED.original_title,
        overview=EXCLUDED.overview,
        poster_path=EXCLUDED.poster_path,
        backdrop_path=EXCLUDED.backdrop_path,
        release_date=EXCLUDED.release_date,
        runtime=EXCLUDED.runtime,
        popularity=EXCLUDED.popularity,
        vote_average=EXCLUDED.vote_average,
        vote_count=EXCLUDED.vote_count,
        status=EXCLUDED.status,
        language=EXCLUDED.language,
        spoken_languages=EXCLUDED.spoken_languages,
        production_countries=EXCLUDED.production_countries,
        cast_names=EXCLUDED.cast_names,
        crew_names=EXCLUDED.crew_names,
        trailer_url=EXCLUDED.trailer_url,
        age_certification=EXCLUDED.age_certification
      RETURNING id
    `,
      [
        m.tmdb_id,
        m.title,
        m.original_title ?? null,
        m.overview ?? null,
        m.poster_path ?? null,
        m.backdrop_path ?? null,
        m.release_date ?? null,
        m.runtime ?? null,
        m.popularity ?? null,
        m.vote_average ?? null,
        m.vote_count ?? null,
        m.status ?? null,
        m.language ?? null,
        m.spoken_languages ?? [],
        m.production_countries ?? [],
        m.cast_names ?? [],
        m.crew_names ?? [],
        m.trailer_url ?? null,
        m.age_certification ?? null,
      ]
    );

    const movieId = up.rows[0].id;

    await client.query(`DELETE FROM movie_genres WHERE movie_id=$1`, [movieId]);
    for (const g of m.genres) {
      await client.query(
        `INSERT INTO movie_genres(movie_id,genre_id) VALUES($1,$2) ON CONFLICT DO NOTHING`,
        [movieId, g.id]
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

export async function findMovieDetailByTmdbId(tmdbId: number) {
  const { rows } = await pool.query(
    `
    SELECT
      id,
      tmdb_id        AS "tmdbId",
      title,
      overview,
      poster_path    AS "posterPath",
      backdrop_path  AS "backdropPath",
      TO_CHAR(release_date,'YYYY-MM-DD') AS "releaseDate",
      runtime        AS "time",
      spoken_languages,
      production_countries,
      cast_names,
      crew_names,
      trailer_url,
      age_certification,
      vote_average   AS "voteAverage"
    FROM movies WHERE tmdb_id=$1
  `,
    [tmdbId]
  );

  if (rows.length === 0) return null;

  const genres = await pool.query(
    `
    SELECT g.id,g.name FROM movie_genres mg
    JOIN genres g ON g.id=mg.genre_id
    WHERE mg.movie_id=$1
    ORDER BY g.name
  `,
    [rows[0].id]
  );

  return { ...rows[0], genres: genres.rows };
}
//CRUD

export async function adminCreateMovie(payload: any) {
  const {
    tmdb_id,
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    runtime,
    popularity,
    vote_average,
    vote_count,
    status,
    language,
  } = payload;

  const sql = `
    INSERT INTO movies (
      tmdb_id, title, original_title, overview,
      poster_path, backdrop_path, release_date,
      runtime, popularity, vote_average, vote_count,
      status, language
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
    ON CONFLICT (tmdb_id) DO NOTHING
    RETURNING *;
  `;
  const params = [
    tmdb_id,
    title,
    original_title,
    overview,
    poster_path,
    backdrop_path,
    release_date,
    runtime,
    popularity,
    vote_average,
    vote_count,
    status,
    language,
  ];
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

export async function adminUpdateMovie(tmdbId: number, patch: any) {
  // cập nhật tối giản: chỉ vài trường hay build dynamic SET
  const sql = `
    UPDATE movies
       SET title = COALESCE($2, title),
           overview = COALESCE($3, overview),
           poster_path = COALESCE($4, poster_path),
           backdrop_path = COALESCE($5, backdrop_path),
           release_date = COALESCE($6, release_date),
           runtime = COALESCE($7, runtime),
           status = COALESCE($8, status),
           updated_at = now()
     WHERE tmdb_id = $1
  RETURNING *;`;
  const params = [
    tmdbId,
    patch.title ?? null,
    patch.overview ?? null,
    patch.poster_path ?? null,
    patch.backdrop_path ?? null,
    patch.release_date ?? null,
    patch.runtime ?? null,
    patch.status ?? null,
  ];
  const { rows } = await pool.query(sql, params);
  return rows[0];
}

export async function adminDeleteMovie(tmdbId: number) {
  // Xoá mapping genres dựa vào movie_id (UUID) tương ứng với tmdb_id
  await pool.query(
    `DELETE FROM movie_genres
       WHERE movie_id IN (SELECT id FROM movies WHERE tmdb_id = $1);`,
    [tmdbId]
  );

  // Xoá movie
  const { rowCount } = await pool.query(
    `DELETE FROM movies WHERE tmdb_id = $1;`,
    [tmdbId]
  );
  return rowCount > 0;
}
