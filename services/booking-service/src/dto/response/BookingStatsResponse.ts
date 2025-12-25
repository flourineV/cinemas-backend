export interface BookingStatsResponse {
  totalBookings: number;
  confirmedBookings: number;
  cancelledBookings: number;
  pendingBookings: number;
  totalRevenue: string; // numeric as string
}
