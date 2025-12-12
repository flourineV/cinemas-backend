// src/services/client/tmdb-client.service.js
const axios = require("axios");
const config = require("../../config");
const logger = require("../../utils/logger");

const baseUrl = config.tmdbApiUrl || "https://api.themoviedb.org/3";
const apiKey = config.tmdbApiKey;

// helper build url giống Java
function buildUrl(path, params = {}) {
  const q = new URLSearchParams({ api_key: apiKey, ...params }).toString();
  return `${baseUrl}${path}?${q}`;
}

async function fetchNowPlaying() {
  const url = buildUrl("/movie/now_playing", {
    language: "vi-VN",
    page: 1,
  });

  const { data } = await axios.get(url);
  return data?.results || [];
}

async function fetchUpcoming() {
  const url = buildUrl("/movie/upcoming", {
    language: "vi-VN",
    page: 1,
  });

  const { data } = await axios.get(url);
  return data?.results || [];
}

async function fetchMovieDetail(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}`, {
    language: "vi-VN",
  });

  const { data } = await axios.get(url);
  return data;
}

async function fetchCredits(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/credits`, {
    language: "vi-VN",
  });

  const { data } = await axios.get(url);
  return data;
}

async function fetchReleaseDates(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/release_dates`);
  const { data } = await axios.get(url);
  return data;
}

/**
 * GIỐNG HỆT Java:
 * - gọi /videos không language
 * - filter Trailer + YouTube + official first
 * - map ra FULL YOUTUBE URL
 */
async function fetchTrailerKey(tmdbId) {
  const url = buildUrl(`/movie/${tmdbId}/videos`);
  const { data } = await axios.get(url);

  logger.info("TMDb video response", data);

  const results = data?.results || [];
  if (!results.length) return null;

  // ưu tiên official trailer
  const official = results.find(
    (v) =>
      v.type?.toLowerCase() === "trailer" &&
      v.site?.toLowerCase() === "youtube" &&
      (v.official === true || v.official == null)
  );

  if (official?.key) {
    return `https://www.youtube.com/watch?v=${official.key}`;
  }

  // fallback trailer bất kỳ
  const anyTrailer = results.find(
    (v) =>
      v.type?.toLowerCase() === "trailer" && v.site?.toLowerCase() === "youtube"
  );

  return anyTrailer?.key
    ? `https://www.youtube.com/watch?v=${anyTrailer.key}`
    : null;
}

module.exports = {
  fetchNowPlaying,
  fetchUpcoming,
  fetchMovieDetail,
  fetchCredits,
  fetchReleaseDates,
  fetchTrailerKey,
};
