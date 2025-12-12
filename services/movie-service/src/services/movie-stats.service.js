// src/services/movie-stats.service.js

const MovieStatus = require("../entities/movie-status.enum");
const movieSummaryRepo = require("../repositories/movie-summary.repository");
const movieStatsMapper = require("../mappers/movie-stats.mapper");

class MovieStatsService {
  async getOverview() {
    const total = await movieSummaryRepo.countAll();
    const nowPlaying = await movieSummaryRepo.countByStatus(
      MovieStatus.NOW_PLAYING
    );
    const upcoming = await movieSummaryRepo.countByStatus(MovieStatus.UPCOMING);
    const archived = await movieSummaryRepo.countByStatus(MovieStatus.ARCHIVED);

    return movieStatsMapper.toOverview(total, nowPlaying, upcoming, archived);
  }

  async getMonthlyStats() {
    // Java: movieSummaryRepository.countMoviesAddedByMonth()
    const rows = await movieSummaryRepo.countMoviesAddedByMonth();
    return rows.map(movieStatsMapper.toMonthly);
  }
}

module.exports = new MovieStatsService();
