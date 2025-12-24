import axios from 'axios';
import type { MovieResponse } from './MovieResponse.js';
import type { MovieSummaryResponse } from './MovieSummaryResponse.js';

const MOVIE_SERVICE_URL = process.env.MOVIE_SERVICE_URL || 'http://movie-service:8083/api/movies';
const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY as string;

export class MovieServiceClient {
  async getMovieTitle(movieId: string): Promise<string | null> {
    try {
      const url = `${MOVIE_SERVICE_URL}/${movieId}`;
      const response = await axios.get<MovieResponse>(url);
      return response.data?.title || null;
    } catch (err: any) {
      console.error(`Failed to fetch movie title for movieId=${movieId}`, err.message);
      return null;
    }
  }

  async getAvailableMoviesForDateRange(startDate: string, endDate: string): Promise<MovieSummaryResponse[]> {
    try {
      const url = `${MOVIE_SERVICE_URL}/available-for-range?startDate=${startDate}&endDate=${endDate}`;
      const response = await axios.get<MovieSummaryResponse[]>(url);
      return response.data || [];
    } catch (err: any) {
      console.error(`Failed to fetch available movies for date range ${startDate} to ${endDate}`, err.message);
      return [];
    }
  }

  async updateMovieToNowPlaying(movieId: string): Promise<void> {
    try {
      const url = `${MOVIE_SERVICE_URL}/${movieId}/set-now-playing`;
      await axios.post(url, null, {
        headers: {
          'x-internal-secret': INTERNAL_SECRET_KEY,
        },
      });
      console.info(`Updated movie ${movieId} status to NOW_PLAYING`);
    } catch (err: any) {
      console.error(`Failed to update movie ${movieId} status to NOW_PLAYING`, err.message);
    }
  }
}

export const movieServiceClient = new MovieServiceClient();
