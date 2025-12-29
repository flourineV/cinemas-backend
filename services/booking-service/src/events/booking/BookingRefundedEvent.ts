export interface BookingRefundedEvent {
  bookingId: string; // UUID
  userId: string; // UUID
  // guestName: string;
  // guestEmail: string;
  showtimeId: string; // UUID
  refundedValue: string; // numeric as string
  refundMethod: string;
  reason: string;
}
