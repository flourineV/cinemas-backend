import { Router, Request, Response } from "express";
import axios from "axios";
import Movie from "../models/Movie";

// Define types for TMDB API responses
interface TmdbMovie {
  id: number;
  title: string;
  overview: string;
  release_date?: string;
  genre_ids?: number[];
  poster_path?: string;
  runtime?: number;
}

interface TmdbSearchResponse {
  page: number;
  total_results: number;
  total_pages: number;
  results: TmdbMovie[];
}

interface TmdbMovieDetail extends TmdbMovie {
  genres?: { id: number; name: string }[];
}

const router = Router();

const TMDB_BASE_URL = process.env.TMDB_BASE_URL as string;
const TMDB_API_KEY = process.env.TMDB_API_KEY as string;
if (!TMDB_BASE_URL || !TMDB_API_KEY) {
  throw new Error("TMDB_BASE_URL or TMDB_API_KEY not defined in environment");
}
// Get all movies
router.get("/", async (req: Request, res: Response) => {
  const movies = await Movie.find().limit(50);
  res.json(movies);
});

// Search movies
router.get("/search", async (req: Request, res: Response) => {
  try {
    const { query, page = "1" } = req.query;
    if (!query)
      return res.status(400).json({ error: "Query parameter required" });

    // Tell Axios what data type to expect
    const tmdbResponse = await axios.get<TmdbSearchResponse>(
      `${TMDB_BASE_URL}/search/movie`,
      {
        params: {
          api_key: TMDB_API_KEY,
          query,
          page,
          language: "en-US",
        },
      }
    );

    const movies = tmdbResponse.data.results || [];
    const savedMovies = await Promise.all(
      movies.map(movie => {
        const transformedMovie = {
        tmdbId: movie.id,
        title: movie.title,
        overview: movie.overview,
        releaseDate: movie.release_date
          ? new Date(movie.release_date)
          : undefined,
        genres:
          movie.genre_ids?.map((id: number) => ({
            id,
            name: "", // genre names can be filled later if needed
          })) || [],
        posterPath: movie.poster_path,
        runtime: movie.runtime || 0,
      };
        return Movie.findOneAndUpdate(
          { tmdbId: transformedMovie.tmdbId },
          transformedMovie,
          { upsert: true, new: true }
        );
      })
    );

    res.json({
      results: savedMovies,
      totalResults: tmdbResponse.data.total_results,
      page: parseInt(page as string),
    });
  } catch (error: any) {
    console.error("Error:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ error: "Failed to fetch movies" });
  }
});

// Get single movie details
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    let movie = await Movie.findOne({ tmdbId: parseInt(id) });
    if (!movie) {
      const tmdbResponse = await axios.get<TmdbMovieDetail>(
        `${TMDB_BASE_URL}/movie/${id}`,
        {
          params: { api_key: TMDB_API_KEY, language: "en-US" },
        }
      );

      const data = tmdbResponse.data;

      movie = new Movie({
        tmdbId: data.id,
        title: data.title,
        overview: data.overview,
        releaseDate: data.release_date
          ? new Date(data.release_date)
          : undefined,
        genres: data.genres || [],
        posterPath: data.poster_path,
        runtime: data.runtime,
      });

      await movie.save();
    }

    res.json(movie);
  } catch (error: any) {
    console.error("Error:", error.message);
    res.status(500).json({ 
      error: "Failed to fetch movies", 
      details: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
});

export default router;
