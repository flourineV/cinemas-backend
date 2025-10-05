import { Router } from "express";
import {
  // public
  sync,
  nowPlaying,
  upcoming,
  search,
  detail,
  discoverByGenres,
  // ratings
  addRating,
  getRatings,
  getRatingStat,
  // admin
  adminCreate,
  adminUpdate,
  adminDelete,
} from "../controllers/movie.controller";

const r = Router();

// ===== Public =====
r.post("/sync", sync); // POST /api/movies/sync
r.get("/now-playing", nowPlaying); // GET  /api/movies/now-playing?page=&size=
r.get("/upcoming", upcoming); // GET  /api/movies/upcoming?page=&size=
r.get("/search", search); // GET  /api/movies/search?title=&page=&size=
r.get("/discover", discoverByGenres); // GET  /api/movies/discover?withGenres=28,35&page=&size=
r.get("/:tmdbId", detail); // GET  /api/movies/603692

// ===== Ratings =====
r.post("/:tmdbId/ratings", addRating); // POST /api/movies/:tmdbId/ratings  { rating, comment }
r.get("/:tmdbId/ratings", getRatings); // GET  /api/movies/:tmdbId/ratings
r.get("/:tmdbId/rating-stat", getRatingStat); // GET  /api/movies/:tmdbId/rating-stat
// ===== Admin (staff) =====
r.post("/", adminCreate); // POST   /api/movies
r.put("/:tmdbId", adminUpdate); // PUT    /api/movies/:tmdbId
r.delete("/:tmdbId", adminDelete); // DELETE /api/movies/:tmdbId

export default r;
