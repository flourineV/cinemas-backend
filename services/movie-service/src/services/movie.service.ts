// src/services/movie.service.ts
import { tmdbGet } from "./tmdb.service";
import { upsertGenres, getGenreNameMap } from "../repositories/genre.repo";
import {
  upsertMovie,
  findMovieDetailByTmdbId,
} from "../repositories/movie.repo";
import { makePage } from "../models/page";
import { MovieDetailResponse } from "../models/movie";
import {
  extractCertification,
  extractTrailerUrl,
  topNames,
} from "../utils/tmdb-mapper";

/** ========= Genre map cache (id -> name) để gắn genres vào các list ========= */
let genreMapCache: Record<number, string> = {};
let lastGenreLoaded = 0;

async function ensureGenreMap() {
  const now = Date.now();
  if (
    now - lastGenreLoaded < 24 * 60 * 60 * 1000 &&
    Object.keys(genreMapCache).length
  )
    return;

  const dbMap = await getGenreNameMap();
  if (Object.keys(dbMap).length) {
    genreMapCache = dbMap;
    lastGenreLoaded = now;
    return;
  }

  const g = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list",
    { language: "vi-VN" },
    24 * 60 * 60
  );
  const genres = Array.isArray(g?.genres) ? g.genres : [];
  await upsertGenres(genres);
  genreMapCache = Object.fromEntries(genres.map((x) => [x.id, x.name]));
  lastGenreLoaded = now;
}

/** ========= Mapper cho item list ========= */
const mapSummary = (m: any) => ({
  tmdbId: m.id,
  title: m.title,
  posterUrl: m.poster_path ?? null, // FE dùng posterUrl
  releaseDate: m.release_date ?? null,
  voteAverage: m.vote_average ?? null,

  // để FE an toàn khi .map()/.includes()
  spokenLanguages: [],
  trailer: "",

  // map từ genre_ids -> tên
  genres: Array.isArray(m.genre_ids)
    ? m.genre_ids.map((id: number) => genreMapCache[id]).filter(Boolean)
    : [],
});

/** ========= Enrich list bằng detail để lấp đủ thông tin trên card ========= */
async function enrichSummaries(items: any[]) {
  return await Promise.all(
    items.map(async (m) => {
      try {
        const d = await tmdbGet<any>(
          `/movie/${m.id}`,
          {
            append_to_response: "videos,credits,release_dates",
            language: "vi-VN",
          },
          300
        );
        const languages = (d.spoken_languages || []).map(
          (x: any) => x.english_name || x.name
        );
        const countries = (d.production_countries || []).map(
          (c: any) => c.name
        );
        const trailerUrl = extractTrailerUrl(d.videos) || "";
        const age = extractCertification(d.release_dates) || null;

        return {
          ...mapSummary(m),
          time: d.runtime ?? null,
          spokenLanguages: languages,
          country: countries, // nếu FE cần string → join ở FE
          age,
          trailer: trailerUrl,
        };
      } catch {
        return {
          ...mapSummary(m),
          time: null,
          spokenLanguages: [],
          country: [],
          age: null,
          trailer: "",
        };
      }
    })
  );
}

/** ========= Sync genres ========= */
export async function syncGenres() {
  const g = await tmdbGet<{ genres: { id: number; name: string }[] }>(
    "/genre/movie/list",
    { language: "vi-VN" },
    3600
  );
  const genres = Array.isArray(g?.genres) ? g.genres : [];
  await upsertGenres(genres);
  return { synced: genres.length };
}

/** ========= Trang list ========= */
function toTmdbPage(p?: number) {
  const n = Number.isFinite(p as number) ? (p as number) : 0;
  return Math.max(1, n + 1); // zero-based -> one-based
}

export async function getNowPlaying(page: number, size: number) {
  await ensureGenreMap();
  const data = await tmdbGet<any>(
    "/movie/now_playing",
    { page: toTmdbPage(page), language: "vi-VN", region: "VN" },
    300
  );
  const enriched = await enrichSummaries(data?.results ?? []);
  return makePage(
    enriched,
    (data?.page ?? 1) - 1,
    data?.total_pages,
    data?.total_results
  );
}

export async function getUpcoming(page: number, size: number) {
  await ensureGenreMap();
  const data = await tmdbGet<any>(
    "/movie/upcoming",
    { page: toTmdbPage(page), language: "vi-VN", region: "VN" },
    300
  );
  const enriched = await enrichSummaries(data?.results ?? []);
  return makePage(
    enriched,
    (data?.page ?? 1) - 1,
    data?.total_pages,
    data?.total_results
  );
}

export async function searchMovies(title: string, page: number, size: number) {
  await ensureGenreMap();
  if (!title?.trim()) return makePage([], 0, 0, 0);

  const data = await tmdbGet<any>(
    "/search/movie",
    {
      query: title,
      page: toTmdbPage(page),
      include_adult: false,
      language: "vi-VN",
    },
    300
  );
  const enriched = await enrichSummaries(data?.results ?? []);
  return makePage(
    enriched,
    (data?.page ?? 1) - 1,
    data?.total_pages,
    data?.total_results
  );
}

/** ========= Detail ========= */

export async function getDetail(tmdbId: number): Promise<MovieDetailResponse> {
  const cached = await findMovieDetailByTmdbId(tmdbId);
  if (cached) {
    const genreNames = Array.isArray(cached.genres)
      ? cached.genres
          .map((x: any) => (typeof x === "string" ? x : x?.name))
          .filter(Boolean)
      : [];

    return {
      tmdbId: cached.tmdbId,
      title: cached.title,
      overview: cached.overview ?? null,
      posterUrl: cached.posterPath ?? null,
      backdropPath: cached.backdropPath ?? null,
      releaseDate: cached.releaseDate ?? null,
      time: cached.time ?? null,
      spokenLanguages: cached.spoken_languages ?? [],
      country: (cached.production_countries ?? [])[0] ?? null,
      age: cached.age_certification ?? null,
      genres: genreNames, // 👈 luôn là string[]
      cast: cached.cast_names ?? [],
      crew: cached.crew_names ?? [],
      trailer: cached.trailer_url ?? null,
      voteAverage: cached.voteAverage ?? null,
    };
  }

  // 2) TMDb → transform → upsert DB → trả
  const raw = await tmdbGet<any>(
    `/movie/${tmdbId}`,
    {
      append_to_response: "videos,images,credits,release_dates",
      language: "vi-VN",
    },
    300
  );

  const languages = (raw.spoken_languages || []).map(
    (l: any) => l.english_name || l.name
  );
  const countries = (raw.production_countries || []).map((c: any) => c.name);
  const cast = topNames(raw.credits?.cast || [], "cast", undefined, 10);
  const crew = topNames(raw.credits?.crew || [], "crew", "Director", 5);
  const trailerUrl = extractTrailerUrl(raw.videos);
  const age = extractCertification(raw.release_dates);

  // ⬇️ genres: vừa để lưu DB (object[]), vừa trả ra FE (string[])
  const genresObjs = (raw.genres || []).map((g: any) => ({
    id: g.id,
    name: g.name,
  }));
  const genreNames = genresObjs
    .map((g) => g.name)
    .filter(
      (s: any): s is string => typeof s === "string" && s.trim().length > 0
    );

  // Lưu DB: dùng object[] để repo tạo/ghép bảng movie_genres
  await upsertMovie({
    tmdb_id: raw.id,
    title: raw.title,
    original_title: raw.original_title ?? null,
    overview: raw.overview ?? null,
    poster_path: raw.poster_path ?? null,
    backdrop_path: raw.backdrop_path ?? null,
    release_date: raw.release_date ?? null,
    runtime: raw.runtime ?? null,
    popularity: raw.popularity ?? null,
    vote_average: raw.vote_average ?? null,
    vote_count: raw.vote_count ?? null,
    status: raw.status ?? null,
    language: raw.original_language ?? null,
    spoken_languages: languages,
    production_countries: countries,
    cast_names: cast,
    crew_names: crew,
    trailer_url: trailerUrl,
    age_certification: age,
    genres: genresObjs, // 👈 lưu object[]
  });

  // Trả response cho FE: luôn là string[]
  return {
    tmdbId: raw.id,
    title: raw.title,
    overview: raw.overview ?? null,
    posterUrl: raw.poster_path ?? null,
    backdropPath: raw.backdrop_path ?? null,
    releaseDate: raw.release_date ?? null,
    time: raw.runtime ?? null,
    spokenLanguages: languages,
    country: countries[0] ?? null,
    age,
    genres: genreNames, // 👈 FE dùng formatGenres → replace/map OK
    cast,
    crew,
    trailer: trailerUrl,
    voteAverage: raw.vote_average ?? null,
  };
}
import { listByGenres } from "../repositories/genre.repo";

export async function getByGenres(
  genreIds: number[],
  page: number,
  size: number
) {
  const { rows, total } = await listByGenres(genreIds, page, size);
  return makePage(rows, page, Math.ceil(total / size), total);
}
