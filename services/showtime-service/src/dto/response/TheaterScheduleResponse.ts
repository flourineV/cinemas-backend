import type { ShowtimeResponse } from "./ShowtimeResponse.js";

export interface TheaterScheduleResponse {
  theaterId: string;
  theaterName: string;
  theaterAddress: string;
  showtimes: ShowtimeResponse[];
}