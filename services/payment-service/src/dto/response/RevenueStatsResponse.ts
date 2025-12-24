export interface RevenueStatsResponse {
  year: number;
  month?: number;
  totalRevenue: string;       // BigDecimal as string
  totalPayments: number;
  averageOrderValue: string;  // BigDecimal as string
}
