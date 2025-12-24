const MovieStatus = require("../../entities/movie-status.enum");
const movieDetailRepo = require("../../repositories/movie-detail.repository");
const movieSummaryRepo = require("../../repositories/movie-summary.repository");
const tmdbClient = require("../client/tmdb-client.service");
const movieMapper = require("../../mappers/movie.mapper");
const { v4: uuidv4 } = require("uuid");
const { escapeRegExp } = require("../../utils/regex.util"); // bạn sẽ có file này
const mongoose = require("mongoose");
const { normalize } = require("../../utils/age-rating-normalizer");

class MovieServiceImpl {
  // -----------------------------
  // GET MOVIE BY UUID
  // -----------------------------
  async getMovieByUuid(id) {
    const entity = await movieDetailRepo.findById(id);
    if (!entity) throw new Error(`Movie not found with UUID ${id}`);

    return movieMapper.toDetailResponse(entity);
  }

  // -----------------------------
  // SYNC MOVIES (NOW_PLAYING + UPCOMING)
  // -----------------------------
  async syncMovies() {
    const nowPlaying = await tmdbClient.fetchNowPlaying();
    const upcoming = await tmdbClient.fetchUpcoming();

    const allMovies = [...nowPlaying, ...upcoming];
    const activeTmdbIds = new Set(allMovies.map((m) => m.id));

    for (const movie of nowPlaying) {
      const fullMovie = await tmdbClient.fetchMovieDetail(movie.id);
      await this.syncMovie(fullMovie, MovieStatus.NOW_PLAYING);
    }

    for (const movie of upcoming) {
      const fullMovie = await tmdbClient.fetchMovieDetail(movie.id);
      await this.syncMovie(fullMovie, MovieStatus.UPCOMING);
    }

    // --- ARCHIVE MOVIES NOT IN TMDB ACTIVE LIST ---
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
  // -----------------------------
  async syncMovie(movie, status) {
    const credits = await tmdbClient.fetchCredits(movie.id);
    const releaseDates = await tmdbClient.fetchReleaseDates(movie.id);
    const trailer = await tmdbClient.fetchTrailerKey(movie.id);

    const extractAge = () => {
      const us = releaseDates.results.find((r) => r.iso_3166_1 === "US");
      if (!us) return null;

      const found = us.release_dates.find(
        (r) => r.certification && r.certification.length > 0
      );
      return found ? found.certification : null;
    };

    const age = normalize(extractAge());

    // --- SUMMARY ---
    let summary = await movieSummaryRepo.findByTmdbId(movie.id);
    const sharedId = summary ? summary.id : uuidv4();

    const summaryEntity = {
      _id: sharedId,
      tmdbId: movie.id,
      title: movie.title,
      posterUrl: movie.poster_path,
      status,
      spokenLanguages: movie.spoken_languages.map((l) => l.iso_639_1),
      country: movie.production_countries[0]?.name || null,
      time: movie.runtime,
      genres: movie.genres.map((g) => g.name),
      age,
      trailer,
      startDate: movie.release_date || null,
      endDate: null,
      popularity: movie.popularity || 0,
    };

    await movieSummaryRepo.save(summaryEntity);

    // --- DETAIL ---
    let detail = await movieDetailRepo.findByTmdbId(movie.id);

    const detailEntity = {
      _id: sharedId,
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      time: movie.runtime,
      spokenLanguages: movie.spoken_languages.map((l) => l.english_name),
      country: movie.production_countries[0]?.name || null,
      releaseDate: movie.release_date,
      genres: movie.genres.map((g) => g.name),
      cast: credits.cast.map((c) => c.name).slice(0, 10),
      crew: credits.crew
        .filter((c) => c.job.toLowerCase() === "director")
        .map((c) => c.name),
      age,
      trailer,
      posterUrl: movie.poster_path,
    };

    await movieDetailRepo.save(detailEntity);
  }

  // -----------------------------
  // NOW PLAYING / UPCOMING / ARCHIVED
  // -----------------------------
  async getNowPlayingMovies(page, size) {
    const content = await movieSummaryRepo.findByStatus(
      MovieStatus.NOW_PLAYING,
      page,
      size
    );
    const total = await movieSummaryRepo.countByStatus(MovieStatus.NOW_PLAYING);

    return {
      content: content.map(movieMapper.toSummaryResponse),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  async getUpcomingMovies(page, size) {
    const content = await movieSummaryRepo.findByStatus(
      MovieStatus.UPCOMING,
      page,
      size
    );
    const total = await movieSummaryRepo.countByStatus(MovieStatus.UPCOMING);

    return {
      content: content.map(movieMapper.toSummaryResponse),
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
  // SEARCH MOVIES
  // -----------------------------
  async searchMovies(keyword) {
    if (!keyword || keyword.trim() === "") {
      throw new Error("Title parameter is required");
    }

    const list = await movieSummaryRepo.searchByTitle(keyword);
    return list.map(movieMapper.toSummaryResponse);
  }

  // -----------------------------
  // GET MOVIE DETAIL (fall back to TMDb)
  // -----------------------------
  async getMovieDetail(tmdbId) {
    if (!tmdbId) throw new Error("TMDb ID is required");

    const existing = await movieDetailRepo.findByTmdbId(tmdbId);
    if (existing) return movieMapper.toDetailResponse(existing);

    // fetch từ TMDb
    const movie = await tmdbClient.fetchMovieDetail(tmdbId);
    const credits = await tmdbClient.fetchCredits(tmdbId);
    const releaseDates = await tmdbClient.fetchReleaseDates(tmdbId);
    const trailer = await tmdbClient.fetchTrailerKey(tmdbId);

    const extractAge = () => {
      const us = releaseDates.results.find((r) => r.iso_3166_1 === "US");
      if (!us) return null;
      const found = us.release_dates.find((r) => r.certification);
      return found ? found.certification : null;
    };

    const age = normalize(extractAge());

    const detail = {
      _id: uuidv4(),
      tmdbId: movie.id,
      title: movie.title,
      overview: movie.overview,
      time: movie.runtime,
      spokenLanguages: movie.spoken_languages.map((l) => l.english_name),
      country: movie.production_countries[0]?.name || null,
      releaseDate: movie.release_date,
      genres: movie.genres.map((g) => g.name),
      cast: credits.cast.map((c) => c.name).slice(0, 10),
      crew: credits.crew
        .filter((c) => c.job.toLowerCase() === "director")
        .map((c) => c.name),
      age,
      trailer,
    };

    await movieDetailRepo.save(detail);
    return movieMapper.toDetailResponse(detail);
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
    if (req.posterUrl) summary.posterUrl = req.posterUrl;
    if (req.genres) {
      detail.genres = req.genres;
      summary.genres = req.genres;
    }
    if (req.time) detail.time = req.time;
    if (req.country) detail.country = req.country;
    if (req.trailer) detail.trailer = req.trailer;
    if (req.age) detail.age = req.age;

    await movieDetailRepo.save(detail);
    await movieSummaryRepo.save(summary);

    return movieMapper.toDetailResponse(detail);
  }

  // -----------------------------
  // ADMIN SEARCH (with paging)
  // -----------------------------
  async adminSearch(keyword, status, page, size) {
    const query = {};

    if (keyword) {
      query.title = { $regex: escapeRegExp(keyword), $options: "i" };
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
      data: list.map(movieMapper.toSummaryResponse),
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
  }

  // -----------------------------
  // DELETE MOVIE
  // -----------------------------
  async deleteMovie(id) {
    await movieDetailRepo.deleteById(id);
    await movieSummaryRepo.deleteById(id);
  }
  // -----------------------------
  // AVAILABLE FOR RANGE (NOW_PLAYING + UPCOMING) like Java
  // -----------------------------
  async getAvailableMoviesForDateRange(startDate, endDate) {
    const list = await movieSummaryRepo.findAvailableForRange(
      startDate,
      endDate
    );
    return list.map(movieMapper.toSummaryResponse);
  }
}

module.exports = new MovieServiceImpl();
