import type { SeatSelectionDetail } from "./SeatSelectionDetail.js";

export interface SeatLockRequest {
  userId: string;
  guestSessionId: string;
  showtimeId: string;
  selectedSeats: SeatSelectionDetail[];
}