import type { SeatSelectionDetail } from "./SeatSelectionDetail.js";

export interface SingleSeatLockRequest {
  userId: string;
  //guestSessionId: string;
  showtimeId: string;
  selectedSeat: SeatSelectionDetail;
}