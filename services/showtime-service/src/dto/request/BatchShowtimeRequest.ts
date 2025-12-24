import type { ShowtimeRequest } from "./ShowtimeRequest.js";

export interface BatchShowtimeRequest {
  showtimes: ShowtimeRequest[];
  skipOnConflict: boolean; // true: skip conflicting ones, false: fail entire batch
}