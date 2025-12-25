export interface RevenueStatsResponse {
  year: number;
  month?: number; // optional, can be null in Java
  totalRevenue: string; // numeric as string
  totalBookings: number;
  averageOrderValue: string; // numeric as string
}
