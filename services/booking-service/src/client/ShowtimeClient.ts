import axios from "axios";
import type { AxiosInstance } from "axios";
import CircuitBreaker from "opossum";
import type { ShowtimeDetailResponse } from "../dto/external/ShowtimeDetailResponse.js";
import type { ShowtimeResponse } from "../dto/external/ShowtimeResponse.js";
import type { SeatResponse } from "../dto/external/SeatResponse.js";
import type { PagedResponse } from "../dto/response/PagedResponse.js";

export class ShowtimeClient {
  private client: AxiosInstance;

  private getShowtimeBreaker: CircuitBreaker<[string], ShowtimeResponse>;
  private getSeatBreaker: CircuitBreaker<[string], SeatResponse>;
  private getFilteredShowtimeBreaker: CircuitBreaker<
    [string | null, string | null, string | null, string | null],
    ShowtimeDetailResponse[]
  >;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
    });

    const options = { 
        timeout: 3000, 
        errorThresholdPercentage: 50, 
        resetTimeout: 10000 
    };

    this.getShowtimeBreaker = new CircuitBreaker(this._getShowtimeById.bind(this), options);
    this.getShowtimeBreaker.fallback((showtimeId: string) => ({
      id: showtimeId,
      movieId: null,
      theaterName: "Unknown Theater",
      roomName: "Unknown Room",
      startTime: null,
      endTime: null,
      price: "0",
    }));
    this.getShowtimeBreaker.on('fallback', (result, args) => {
      const showtimeId = Array.isArray(args) ? args[0] : 'unknown';
      console.warn('Circuit breaker fallback triggered for showtimeId:', showtimeId);
    });
    this.getShowtimeBreaker.on('failure', (error, args) => {
      const showtimeId = Array.isArray(args) ? args[0] : 'unknown';
      console.error('Circuit breaker failure for showtimeId:', showtimeId, error.message);
    });

    this.getSeatBreaker = new CircuitBreaker(this._getSeatInfoById.bind(this), options);
    this.getSeatBreaker.fallback((seatId: string) => ({
      id: seatId,
      seatNumber: "N/A",
      roomName: "Unknown Room",
    }));

    this.getFilteredShowtimeBreaker = new CircuitBreaker(this._getShowtimesByFilter.bind(this), options);
    this.getFilteredShowtimeBreaker.fallback(() => []);
  }

  // Public API
  async getShowtimeById(showtimeId: string): Promise<ShowtimeResponse> {
    return this.getShowtimeBreaker.fire(showtimeId);
  }

  async getSeatInfoById(seatId: string): Promise<SeatResponse> {
    return this.getSeatBreaker.fire(seatId);
  }

  async getShowtimesByFilter(
    provinceId: string | null,
    theaterId: string | null,
    startOfDay: string | null,
    endOfDay: string | null
  ): Promise<ShowtimeDetailResponse[]> {
    return this.getFilteredShowtimeBreaker.fire(provinceId, theaterId, startOfDay, endOfDay);
  }

  // Private helpers
  private async _getShowtimeById(showtimeId: string): Promise<ShowtimeResponse> {
    const res = await this.client.get<ShowtimeResponse>(`/api/showtimes/showtimes/${showtimeId}`);
    return res.data;
  }

  private async _getSeatInfoById(seatId: string): Promise<SeatResponse> {
    const res = await this.client.get<SeatResponse>(`/api/showtimes/seats/${seatId}`);
    return res.data;
  }

  private async _getShowtimesByFilter(
    provinceId: string | null,
    theaterId: string | null,
    startOfDay: string | null,
    endOfDay: string | null
  ): Promise<ShowtimeDetailResponse[]> {
    const params: Record<string, string | number> = { page: 1, size: 10000 };

    if (provinceId) params["provinceId"] = provinceId;
    if (theaterId) params["theaterId"] = theaterId;
    if (startOfDay) params["startOfDay"] = startOfDay;
    if (endOfDay) params["endOfDay"] = endOfDay;

    const res = await this.client.get<PagedResponse<ShowtimeDetailResponse>>("/api/showtimes/showtimes/admin/search", {
      params,
    });
    return res.data.data;
  }
}
