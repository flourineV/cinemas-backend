import type { ShowtimeResponse } from "./ShowtimeResponse.js";

export interface ShowtimeConflictResponse {
  hasConflict: boolean;
  message: string;
  conflictingShowtimes: ShowtimeResponse[];
}