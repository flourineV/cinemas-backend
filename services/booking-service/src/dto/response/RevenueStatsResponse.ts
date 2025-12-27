export interface RevenueStatsResponse {
  year: number;
  month?: number; // optional
  totalRevenue: string; // numeric as string
  totalBookings: number;
  averageOrderValue: string; // numeric as string
}
