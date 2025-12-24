export interface PaymentStatsResponse {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalRevenue: string; // BigDecimal as string
}
