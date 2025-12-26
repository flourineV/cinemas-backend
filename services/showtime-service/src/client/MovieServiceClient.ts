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
      // Format dates to YYYY-MM-DD format
      const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      
      const formattedStartDate = formatDate(startDate);
      const formattedEndDate = formatDate(endDate);
      
      const url = `${MOVIE_SERVICE_URL}/available-for-range?startDate=${formattedStartDate}&endDate=${formattedEndDate}`;
      
      console.log('Requesting URL:', url); // Debug log
      
      const response = await axios.get<MovieSummaryResponse[]>(url);
      console.log(response);
      return response.data || [];
    } catch (err: any) {
      console.error(`Failed to fetch available movies for date range ${startDate} to ${endDate}`, err.message);
      console.error('Full error:', err.response?.data); // More detailed error
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
