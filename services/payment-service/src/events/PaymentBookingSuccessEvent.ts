/**
 * Event gửi sang Booking Service khi thanh toán booking thành công.
 */
export interface PaymentBookingSuccessEvent {
  paymentId: string;
  bookingId: string;
  showtimeId: string;
  userId: string;
  amount: string; //bigNumber -> string
  method: string;
  seatIds: string[];
  message: string;
}