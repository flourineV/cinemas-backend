import type { TheaterScheduleResponse } from "./TheaterScheduleResponse.js";

export interface ShowtimesByMovieResponse {
  availableDates: string[]; // ISO date string (yyyy-MM-dd)
  scheduleByDate: Record<string, TheaterScheduleResponse[]>;
}