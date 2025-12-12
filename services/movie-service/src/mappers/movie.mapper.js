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
    trailer: entity.trailer,
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
    time: entity.time,
    country: entity.country,
    spokenLanguages: entity.spokenLanguages || [],
    crew: entity.crew || [],
    cast: entity.cast || [],
    releaseDate: entity.releaseDate,
    overview: entity.overview,
    trailer: entity.trailer,
  };
}

module.exports = {
  toSummaryResponse,
  toSummaryResponsePage,
  toSummaryResponseList,
  toDetailResponse,
};
