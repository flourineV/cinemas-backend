import type { ShowtimeResponse } from "./ShowtimeResponse.js";

export interface BatchShowtimeResponse {
  totalRequested: number;
  successCount: number;
  failedCount: number;
  createdShowtimes: ShowtimeResponse[];
  errors: string[];
}