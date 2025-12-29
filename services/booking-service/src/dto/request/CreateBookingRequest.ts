import type { SeatSelectionDetail } from './SeatSelectionDetail.js';

export interface CreateBookingRequest {
  showtimeId: string; // UUID
  selectedSeats: SeatSelectionDetail[];
  //guestName?: string;
  //guestEmail?: string;
  userId?: string; // UUID
  //guestSessionId?: string; // UUID
}
