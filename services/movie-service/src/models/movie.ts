export type Genre = { id: number; name: string };

export type MovieSummaryResponse = {
  tmdbId: number;
  title: string;
  posterPath: string | null; // FE gọi getPosterUrl(posterPath)
  releaseDate: string | null; // yyyy-MM-dd
  voteAverage: number | null;
};

export type MovieDetailResponse = {
  tmdbId: number;
  title: string;
  overview: string | null;
  posterUrl: string | null; // FE dùng movie.posterUrl  -> getPosterUrl()
  backdropPath: string | null;
  releaseDate: string | null;
  time: number | null; // runtime
  spokenLanguages: string[]; // FE join(", ")
  country: string | null; // 1 country chính (nếu có)
  age: string | null; // certification
  genres: Genre[];
  cast: string[]; // names
  crew: string[]; // names (đạo diễn đầu list)
  trailer: string | null; // youtube/watch?v=...
  voteAverage: number | null;
};
