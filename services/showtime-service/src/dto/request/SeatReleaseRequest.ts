export interface SeatReleaseRequest {
  showtimeId: string;
  seatIds: string[]; // chỉ cần ID ghế
  bookingId?: string | null; // có thể null nếu là Admin Release
  reason: string; // "manual_cancel", "admin_override", ...
}