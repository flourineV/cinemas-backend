export interface BookingRefundedEvent {
  bookingId: string;       
  userId?: string;         // nullable
  // guestName?: string;
  // guestEmail?: string;
  showtimeId?: string;
  refundedValue: number;   
  refundMethod: string;    // "VOUCHER" | "COUNTER"
  reason: string;
  language?: string;       // "vi" | "en"
}
