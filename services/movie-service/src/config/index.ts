import "dotenv/config";

export const config = {
  env: process.env.NODE_ENV ?? "development",
  port: Number(process.env.PORT ?? 4002),
  serviceName: process.env.SERVICE_NAME ?? "movie-service",
  tmdb: {
    baseURL: process.env.TMDB_BASE_URL ?? "https://api.themoviedb.org/3",
    apiKey: process.env.TMDB_API_KEY ?? "",
    language: process.env.TMDB_LANGUAGE ?? "vi-VN",
    imageOrigin: process.env.TMDB_IMAGE_ORIGIN ?? "https://image.tmdb.org/t/p",
  },
  pg: {
    url: process.env.PG_URL!,
  },
};
