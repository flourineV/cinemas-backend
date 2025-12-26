/**
 * Gửi sang Booking khi thanh toán thất bại.
 */
export interface PaymentBookingFailedEvent {
  paymentId: string;
  bookingId: string;
  showtimeId: string;
  userId: string;
  amount: string; //bigNumber -> string
  method: string;
  seatIds: string[];
  reason: string;
}