// src/services/impl/movie.service.impl.js
const MovieStatus = require("../../entities/movie-status.enum");
const movieDetailRepo = require("../../repositories/movie-detail.repository");
const movieSummaryRepo = require("../../repositories/movie-summary.repository");
const tmdbClient = require("../client/tmdb-client.service");
const movieMapper = require("../../mappers/movie.mapper");
const { v4: uuidv4 } = require("uuid");
const { escapeRegExp } = require("../../utils/regex.util");
const mongoose = require("mongoose");
const { normalize } = require("../../utils/age-rating-normalizer");

/**
 * Normalize Accept-Language header to "vi" | "en"
 * Examples:
 * - "en-US,en;q=0.9" -> "en"
 * - "vi-VN,vi;q=0.9" -> "vi"
 */
function normalizeLang(acceptLanguage) {
  const h = String(acceptLanguage || "")
    .toLowerCase()
    .trim();
  if (h.startsWith("en")) return "en";
  return "vi";
}

/**
 * Apply translation (summary)
 * - if lang=en: use titleEn/genresEn/countryEn when available
 * - else: keep Vietnamese fields (default)
 */
function applyLangSummary(dto, entity, lang) {
  if (lang !== "en") return dto;

  return {
    ...dto,
    title: entity.titleEn || dto.title,
    genres:
      Array.isArray(entity.genresEn) && entity.genresEn.length
        ? entity.genresEn
        : dto.genres,
    country: entity.countryEn || dto.country,
  };
}

/**
 * Apply translation (detail)
 */
function applyLangDetail(dto, entity, lang) {
  if (lang !== "en") return dto;

  return {
    ...dto,
    title: entity.titleEn || dto.title,
    overview: entity.overviewEn || dto.overview,
    genres:
      Array.isArray(entity.genresEn) && entity.genresEn.length
        ? entity.genresEn
        : dto.genres,
    country: entity.countryEn || dto.country,
  };
}

/**
 * Extract US age rating (like Java)
 */
function extractAgeRating(releaseDates) {
  const results = releaseDates?.results || [];
  const us = results.find((r) => r.iso_3166_1 === "US");
  if (!us) return null;

  const found = (us.release_dates || []).find(
    (r) => r?.certification && r.certification.length > 0
  );
  return found ? found.certification : null;
}

/**
 * Spoken languages -> store ISO codes (iso_639_1)
 */
function getSpokenLangCodes(movie) {
  return (movie?.spoken_languages || [])
    .map((l) => l?.iso_639_1)
    .filter(Boolean);
}

/**
 * Country name from TMDb response (already localized by language param)
 */
function getCountryName(movie) {
  return movie?.production_countries?.[0]?.name ?? null;
}

class MovieServiceImpl {
  // -----------------------------
  // GET MOVIE BY UUID (supports language)
  // -----------------------------
  async getMovieByUuid(id, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    const entity = await movieDetailRepo.findById(id);
    if (!entity) throw new Error(`Movie not found with UUID ${id}`);

    const dto = movieMapper.toDetailResponse(entity);
    return applyLangDetail(dto, entity, lang);
  }

  // -----------------------------
  // SYNC MOVIES (NOW_PLAYING + UPCOMING) => save VI + EN
  // -----------------------------
  async syncMovies() {
    const nowPlaying = await tmdbClient.fetchNowPlaying(); // vi list
    const upcoming = await tmdbClient.fetchUpcoming(); // vi list

    const allMovies = [...nowPlaying, ...upcoming];
    const activeTmdbIds = new Set(allMovies.map((m) => m.id));

    for (const movie of nowPlaying) {
      const movieVi = await tmdbClient.fetchMovieDetail(movie.id, "vi");
      const movieEn = await tmdbClient.fetchMovieDetail(movie.id, "en");
      await this.syncMovie(movieVi, movieEn, MovieStatus.NOW_PLAYING);
    }

    for (const movie of upcoming) {
      const movieVi = await tmdbClient.fetchMovieDetail(movie.id, "vi");
      const movieEn = await tmdbClient.fetchMovieDetail(movie.id, "en");
      await this.syncMovie(movieVi, movieEn, MovieStatus.UPCOMING);
    }

    // archive movies not active
    const dbMovies = await movieSummaryRepo.findAll();
    for (const summary of dbMovies) {
      if (
        !activeTmdbIds.has(summary.tmdbId) &&
        summary.status !== MovieStatus.ARCHIVED
      ) {
        summary.status = MovieStatus.ARCHIVED;
        await movieSummaryRepo.save(summary);
      }
    }

    return { synced: activeTmdbIds.size };
  }

  // -----------------------------
  // SYNC A SINGLE MOVIE (DETAIL + SUMMARY)
  // Input: movieVi, movieEn
  // -----------------------------
  async syncMovie(movieVi, movieEn, status) {
    const credits = await tmdbClient.fetchCredits(movieVi.id, "vi");
    const releaseDates = await tmdbClient.fetchReleaseDates(movieVi.id);
    const trailer = await tmdbClient.fetchTrailerKey(movieVi.id);

    const age = normalize(extractAgeRating(releaseDates));
    const spokenCodes = getSpokenLangCodes(movieVi);

    // --- SUMMARY ---
    const summary = await movieSummaryRepo.findByTmdbId(movieVi.id);
    const sharedId = summary ? summary.id : uuidv4();

    const summaryEntity = {
      _id: sharedId,
      tmdbId: movieVi.id,

      title: movieVi.title,
      titleEn: movieEn?.title ?? movieVi.title,

      posterUrl: movieVi.poster_path,
      status,

      spokenLanguages: spokenCodes, // ISO codes

      country: getCountryName(movieVi),
      countryEn: getCountryName(movieEn),

      countryCode: movieVi.production_countries?.[0]?.iso_3166_1 || null,

      time: movieVi.runtime,

      genres: (movieVi.genres || []).map((g) => g.name),
      genresEn: (movieEn?.genres || []).map((g) => g.name),

      genreIds: (movieVi.genres || []).map((g) => g.id),

      age,
      trailer,

      startDate: movieVi.release_date || null,
      endDate: null,
      popularity: movieVi.popularity || 0,
    };

    await movieSummaryRepo.save(summaryEntity);

    // --- DETAIL ---
    const detailEntity = {
      _id: sharedId,
      tmdbId: movieVi.id,

      title: movieVi.title,
      titleEn: movieEn?.title ?? movieVi.title,

      overview: movieVi.overview,
      overviewEn: movieEn?.overview ?? movieVi.overview,

      time: movieVi.runtime,

      spokenLanguages: spokenCodes, // ISO codes

      country: getCountryName(movieVi),
      countryEn: getCountryName(movieEn),

      countryCode: movieVi.production_countries?.[0]?.iso_3166_1 || null,

      releaseDate: movieVi.release_date,

      genres: (movieVi.genres || []).map((g) => g.name),
      genresEn: (movieEn?.genres || []).map((g) => g.name),

      genreIds: (movieVi.genres || []).map((g) => g.id),

      cast: (credits?.cast || []).map((c) => c.name).slice(0, 10),
      crew: (credits?.crew || [])
        .filter((c) => (c.job || "").toLowerCase() === "director")
        .map((c) => c.name),

      age,
      trailer,
      posterUrl: movieVi.poster_path,
    };

    await movieDetailRepo.save(detailEntity);
  }

  // -----------------------------
  // NOW PLAYING / UPCOMING / ARCHIVED (supports language)
  // -----------------------------
  async getNowPlayingMovies(page, size, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    const content = await movieSummaryRepo.findByStatus(
      MovieStatus.NOW_PLAYING,
      page,
      size
    );
    const total = await movieSummaryRepo.countByStatus(MovieStatus.NOW_PLAYING);

    return {
      content: content.map((e) =>
        applyLangSummary(movieMapper.toSummaryResponse(e), e, lang)
      ),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  async getUpcomingMovies(page, size, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    const content = await movieSummaryRepo.findByStatus(
      MovieStatus.UPCOMING,
      page,
      size
    );
    const total = await movieSummaryRepo.countByStatus(MovieStatus.UPCOMING);

    return {
      content: content.map((e) =>
        applyLangSummary(movieMapper.toSummaryResponse(e), e, lang)
      ),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  async getArchivedMovies(page, size) {
    const content = await movieSummaryRepo.findByStatus(
      MovieStatus.ARCHIVED,
      page,
      size
    );
    const total = await movieSummaryRepo.countByStatus(MovieStatus.ARCHIVED);

    return {
      content: content.map(movieMapper.toSummaryResponse),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  // -----------------------------
  // SEARCH MOVIES (supports language)
  // - Prefer: repo supports OR title/titleEn
  // - If repo only searchByTitle => use adminSearch style here
  // -----------------------------
  async searchMovies(keyword, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    if (!keyword || keyword.trim() === "") {
      throw new Error("Title parameter is required");
    }

    // If your repo already supports searching titleEn too, keep using it.
    // Otherwise do direct query here:
    const re = { $regex: escapeRegExp(keyword), $options: "i" };
    const list = await mongoose
      .model("MovieSummary")
      .find({
        status: { $ne: MovieStatus.ARCHIVED },
        $or: [{ title: re }, { titleEn: re }],
      })
      .limit(50)
      .exec();

    return list.map((e) =>
      applyLangSummary(movieMapper.toSummaryResponse(e), e, lang)
    );
  }

  // -----------------------------
  // GET MOVIE DETAIL (supports language)
  // -----------------------------
  async getMovieDetail(tmdbId, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    if (!tmdbId) throw new Error("TMDb ID is required");

    const existing = await movieDetailRepo.findByTmdbId(tmdbId);
    if (existing) {
      return applyLangDetail(
        movieMapper.toDetailResponse(existing),
        existing,
        lang
      );
    }

    // fetch TMDb both languages (to save once, serve many)
    const movieVi = await tmdbClient.fetchMovieDetail(tmdbId, "vi");
    const movieEn = await tmdbClient.fetchMovieDetail(tmdbId, "en");

    const credits = await tmdbClient.fetchCredits(tmdbId, "vi");
    const releaseDates = await tmdbClient.fetchReleaseDates(tmdbId);
    const trailer = await tmdbClient.fetchTrailerKey(tmdbId);
    const age = normalize(extractAgeRating(releaseDates));

    const spokenCodes = getSpokenLangCodes(movieVi);

    const id = uuidv4();

    const detailEntity = {
      _id: id,
      tmdbId: movieVi.id,

      title: movieVi.title,
      titleEn: movieEn?.title ?? movieVi.title,

      overview: movieVi.overview,
      overviewEn: movieEn?.overview ?? movieVi.overview,

      time: movieVi.runtime,
      spokenLanguages: spokenCodes,

      country: getCountryName(movieVi),
      countryEn: getCountryName(movieEn),
      countryCode: movieVi.production_countries?.[0]?.iso_3166_1 || null,

      releaseDate: movieVi.release_date,

      genres: (movieVi.genres || []).map((g) => g.name),
      genresEn: (movieEn?.genres || []).map((g) => g.name),
      genreIds: (movieVi.genres || []).map((g) => g.id),

      cast: (credits?.cast || []).map((c) => c.name).slice(0, 10),
      crew: (credits?.crew || [])
        .filter((c) => (c.job || "").toLowerCase() === "director")
        .map((c) => c.name),

      age,
      trailer,
      posterUrl: movieVi.poster_path,
    };

    await movieDetailRepo.save(detailEntity);

    // also create summary (optional, but good for consistent DB)
    const summaryEntity = {
      _id: id,
      tmdbId: movieVi.id,
      title: movieVi.title,
      titleEn: movieEn?.title ?? movieVi.title,
      posterUrl: movieVi.poster_path,
      status: MovieStatus.UPCOMING, // or compute based on dates if you want
      spokenLanguages: spokenCodes,
      country: getCountryName(movieVi),
      countryEn: getCountryName(movieEn),
      countryCode: movieVi.production_countries?.[0]?.iso_3166_1 || null,
      time: movieVi.runtime,
      genres: (movieVi.genres || []).map((g) => g.name),
      genresEn: (movieEn?.genres || []).map((g) => g.name),
      genreIds: (movieVi.genres || []).map((g) => g.id),
      age,
      trailer,
      startDate: movieVi.release_date || null,
      endDate: null,
      popularity: movieVi.popularity || 0,
    };

    await movieSummaryRepo.save(summaryEntity);

    const dto = movieMapper.toDetailResponse(detailEntity);
    return applyLangDetail(dto, detailEntity, lang);
  }

  // -----------------------------
  // UPDATE MOVIE
  // -----------------------------
  async updateMovie(id, req) {
    const detail = await movieDetailRepo.findById(id);
    const summary = await movieSummaryRepo.findById(id);

    if (!detail || !summary) throw new Error("Movie not found");

    if (req.title) {
      detail.title = req.title;
      summary.title = req.title;
    }
    if (req.overview) detail.overview = req.overview;
    if (req.posterUrl) {
      detail.posterUrl = req.posterUrl;
      summary.posterUrl = req.posterUrl;
    }
    if (req.genres) {
      detail.genres = req.genres;
      summary.genres = req.genres;
    }
    if (req.time) {
      detail.time = req.time;
      summary.time = req.time;
    }
    if (req.country) {
      detail.country = req.country;
      summary.country = req.country;
    }
    if (req.trailer) {
      detail.trailer = req.trailer;
      summary.trailer = req.trailer;
    }
    if (req.age) {
      detail.age = req.age;
      summary.age = req.age;
    }

    await movieDetailRepo.save(detail);
    await movieSummaryRepo.save(summary);

    return movieMapper.toDetailResponse(detail);
  }

  // -----------------------------
  // ADMIN SEARCH (supports language)
  // -----------------------------
  async adminSearch(keyword, status, page, size, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    const query = {};

    if (keyword && keyword.trim() !== "") {
      const re = { $regex: escapeRegExp(keyword), $options: "i" };
      query.$or = [{ title: re }, { titleEn: re }];
    }

    if (status) query.status = status;

    const total = await mongoose.model("MovieSummary").countDocuments(query);
    const list = await mongoose
      .model("MovieSummary")
      .find(query)
      .skip(page * size)
      .limit(size)
      .exec();

    return {
      data: list.map((e) =>
        applyLangSummary(movieMapper.toSummaryResponse(e), e, lang)
      ),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  // -----------------------------
  // CHANGE STATUS
  // -----------------------------
  async changeStatus(id, status) {
    if (!status) throw new Error("Status required");
    await movieSummaryRepo.update(id, { status });
    await movieDetailRepo.update?.(id, { status }); // nếu repo detail có update thì update luôn
  }

  // -----------------------------
  // INTERNAL: BATCH TITLES (optional language)
  // -----------------------------
  async getBatchMovieTitles(movieIds, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    if (!Array.isArray(movieIds)) {
      throw new Error("movieIds must be an array");
    }

    const ids = movieIds
      .filter((x) => typeof x === "string" && x.trim() !== "")
      .map((x) => x.trim());

    if (ids.length === 0) return {};

    const docs = await mongoose
      .model("MovieSummary")
      .find({ _id: { $in: ids } })
      .select({ _id: 1, title: 1, titleEn: 1 })
      .exec();

    const result = {};
    for (const d of docs) {
      const title = lang === "en" ? d.titleEn || d.title : d.title;
      result[String(d._id)] = title || "Unknown Movie";
    }
    return result;
  }

  // -----------------------------
  // DELETE MOVIE
  // -----------------------------
  async deleteMovie(id) {
    await movieDetailRepo.deleteById(id);
    await movieSummaryRepo.deleteById(id);
  }

  // -----------------------------
  // AVAILABLE FOR RANGE (NOW_PLAYING + UPCOMING)
  // (supports language)
  // -----------------------------
  async getAvailableMoviesForDateRange(startDate, endDate, acceptLanguage) {
    const lang = normalizeLang(acceptLanguage);

    const list = await movieSummaryRepo.findAvailableForRange(
      startDate,
      endDate
    );
    return list.map((e) =>
      applyLangSummary(movieMapper.toSummaryResponse(e), e, lang)
    );
  }
}

module.exports = new MovieServiceImpl();
