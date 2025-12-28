// Mapper tương đương MovieMapper.java

function toSummaryResponse(entity) {
  if (!entity) return null;

  return {
    id: entity.id, // virtual từ mongoose
    tmdbId: entity.tmdbId,
    title: entity.title,
    posterUrl: entity.posterUrl,
    age: entity.age,
    status: entity.status,
    time: entity.time,
    spokenLanguages: entity.spokenLanguages || [],
    genres: entity.genres || [],
    country: entity.country ?? null,
    countryCode: entity.countryCode ?? null,
    genreIds: entity.genreIds || [],
    trailer: entity.trailer,
    startDate: entity.startDate ?? null,
    endDate: entity.endDate ?? null,
    popularity: entity.popularity ?? 0,
  };
}

/**
 * page: {
 *   content: [MovieSummary],
 *   page: number,
 *   size: number,
 *   totalElements: number
 * }
 */
function toSummaryResponsePage(page) {
  const dtos = (page.content || []).map(toSummaryResponse);

  return {
    ...page,
    content: dtos,
  };
}

function toSummaryResponseList(list) {
  return (list || []).map(toSummaryResponse);
}

function toDetailResponse(entity) {
  if (!entity) return null;

  return {
    id: entity.id,
    tmdbId: entity.tmdbId,
    title: entity.title,
    age: entity.age,
    status: entity.status,
    posterUrl: entity.posterUrl,
    genres: entity.genres || [],
    genreIds: entity.genreIds || [],
    time: entity.time,
    country: entity.country,
    countryCode: entity.countryCode ?? null,
    spokenLanguages: entity.spokenLanguages || [],
    crew: entity.crew || [],
    cast: entity.cast || [],
    releaseDate: entity.releaseDate,
    overview: entity.overview,
    trailer: entity.trailer,
    startDate: entity.startDate ?? null,
    endDate: entity.endDate ?? null,
    popularity: entity.popularity ?? 0,
  };
}

module.exports = {
  toSummaryResponse,
  toSummaryResponsePage,
  toSummaryResponseList,
  toDetailResponse,
};
