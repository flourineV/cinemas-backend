import type { ShowtimeSeatResponse } from "./ShowtimeSeatResponse.js";

export interface ShowtimeSeatsLayoutResponse {
  totalSeats: number;
  totalRows: number;
  totalColumns: number;
  seats: ShowtimeSeatResponse[];
}