import axios from "axios";
import type { AxiosInstance } from "axios";
import CircuitBreaker from "opossum";
import type { MovieTitleResponse } from "../dto/external/MovieTitleResponse.js";

export class MovieClient {
  private client: AxiosInstance;

  private getTitleBreaker: CircuitBreaker<[string], MovieTitleResponse>;
  private getBatchBreaker: CircuitBreaker<[string[]], Record<string, string>>;

  private internalSecret: string;

  constructor(baseURL: string, internalSecret: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
    });

    this.internalSecret = internalSecret;

    const options = {
      timeout: 3000,               // fail if call takes longer than 3s
      errorThresholdPercentage: 50,
      resetTimeout: 10000,         // retry after 10s
    };

    // Circuit breaker for single movie
    this.getTitleBreaker = new CircuitBreaker(this._getMovieTitle.bind(this), options);
    this.getTitleBreaker.fallback((movieId: string) => ({
      id: movieId,
      title: null,
      titleEn: null,
    }));

    // Circuit breaker for batch movies
    this.getBatchBreaker = new CircuitBreaker(this._getBatchMovieTitles.bind(this), options);
    this.getBatchBreaker.fallback((movieIds: string[]) => {
      const fallback: Record<string, string> = {};
      movieIds.forEach((id) => {
        fallback[id] = "Unknown Movie";
      });
      return fallback;
    });
  }

  // Public API
  async getMovieTitle(movieId: string): Promise<MovieTitleResponse> {
    return this.getTitleBreaker.fire(movieId);
  }

  async getBatchMovieTitles(movieIds: string[]): Promise<Record<string, string>> {
    if (!movieIds || movieIds.length === 0) return {};
    return this.getBatchBreaker.fire(movieIds);
  }

  // Private helpers
  private async _getMovieTitle(movieId: string): Promise<MovieTitleResponse> {
    const res = await this.client.get<MovieTitleResponse>(
      `/api/movies/${movieId}`
    );
    const movie = res.data;
    return {
      id: movie.id,
      title: movie.title,
      titleEn: movie.titleEn ?? "N/A",
    };
  }

  private async _getBatchMovieTitles(movieIds: string[]): Promise<Record<string, string>> {
    const res = await this.client.post<Record<string, string>>(
      "/api/movies/batch/titles",
      movieIds
    );
    return res.data;
  }
}
