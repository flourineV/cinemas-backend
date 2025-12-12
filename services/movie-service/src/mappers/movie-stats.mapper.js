// src/mappers/movie-stats.mapper.js

function toOverview(total, nowPlaying, upcoming, archived) {
  return {
    totalMovies: total,
    nowPlaying,
    upcoming,
    archived,
  };
}

function toMonthly(row) {
  // row: { year, month, addedMovies }
  return {
    year: row.year,
    month: row.month,
    addedMovies: row.addedMovies,
  };
}

module.exports = { toOverview, toMonthly };
