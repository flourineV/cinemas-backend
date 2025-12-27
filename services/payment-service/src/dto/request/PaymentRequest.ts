export interface PaymentRequest {
  bookingId?: string; // UUID as string
  userId: string;     // UUID as string
  amount: string;     // decimal stored as string to preserve precision
  method: string;     // e.g. "VNPAY", "MOMO", "CASH"
}