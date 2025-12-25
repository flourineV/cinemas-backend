import type { BookingSeatResponse } from './BookingSeatResponse.js';

export interface BookingResponse {
  bookingId: string; // UUID
  bookingCode: string;
  userId?: string; // UUID
  fullName?: string; // From user-profile-service
  showtimeId: string; // UUID
  movieId?: string; // UUID
  movieTitle?: string;
  movieTitleEn?: string;
  theaterName?: string;
  theaterNameEn?: string;
  roomName?: string;
  roomNameEn?: string;
  showDateTime?: string; // ISO string
  guestName?: string;
  guestEmail?: string;
  status: string;
  totalPrice: string; // numeric as string
  discountAmount: string;
  finalPrice: string;
  paymentMethod?: string;
  transactionId?: string;
  seats: BookingSeatResponse[];
}
