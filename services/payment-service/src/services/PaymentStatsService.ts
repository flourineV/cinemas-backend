import { DataSource } from 'typeorm';
import BigNumber from 'bignumber.js';
import { PaymentTransaction } from '../models/PaymentTransaction.js';
import { PaymentStatus } from '../models/PaymentStatus.js';
import type {
  RevenueStatsResponse
} from '../dto/response/RevenueStatsResponse.js';
import type {PaymentStatsResponse} from '../dto/response/PaymentStatsResponse.js'
export class PaymentStatsService {
  constructor(
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Helper to convert string to BigNumber
   */
  private toBigNumber(value: string | number | null | undefined): BigNumber {
    if (value === null || value === undefined) return new BigNumber(0);
    return new BigNumber(value);
  }

  /**
   * Helper to convert BigNumber to string
   */
  private toString(value: BigNumber, decimalPlaces: number = 2): string {
    return value.toFixed(decimalPlaces);
  }

  async getOverview(): Promise<PaymentStatsResponse> {
    const paymentRepository = this.dataSource.getRepository(PaymentTransaction);

    const total = await paymentRepository.count();
    const allPayments = await paymentRepository.find();

    const successful = allPayments.filter(
      (p) => p.status === PaymentStatus.SUCCESS
    ).length;

    const failed = allPayments.filter(
      (p) => p.status === PaymentStatus.FAILED
    ).length;

    const pending = allPayments.filter(
      (p) => p.status === PaymentStatus.PENDING
    ).length;

    const totalRevenue = allPayments
      .filter((p) => p.status === PaymentStatus.SUCCESS)
      .reduce((sum, payment) => {
        return sum.plus(this.toBigNumber(payment.amount));
      }, new BigNumber(0));

    return {
      totalPayments: total,
      successfulPayments: successful,
      failedPayments: failed,
      pendingPayments: pending,
      totalRevenue: this.toString(totalRevenue),
    };
  }

  async getRevenueStats(
    year?: number,
    month?: number
  ): Promise<RevenueStatsResponse[]> {
    const paymentRepository = this.dataSource.getRepository(PaymentTransaction);

    // Get all successful payments
    const allPayments = await paymentRepository.find({
      where: {
        status: PaymentStatus.SUCCESS,
      },
    });

    // Filter by year and month
    const payments = allPayments
      .filter((p) => this.filterByYear(p, year))
      .filter((p) => this.filterByMonth(p, month));

    // Group by year and month
    const grouped = this.groupPayments(payments, month);

    // Map to response
    const stats = Object.entries(grouped).map(([key, groupPayments]) => {
      const parts = key.split('-');
      const yr = parseInt(parts[0]!);
      const mn = parts.length > 1 ? parseInt(parts[1]!) : null;

      const revenue = groupPayments.reduce((sum, payment) => {
        return sum.plus(this.toBigNumber(payment.amount));
      }, new BigNumber(0));

      const count = groupPayments.length;
      const avgValue =
        count > 0
          ? revenue.dividedBy(count).decimalPlaces(2, BigNumber.ROUND_HALF_UP)
          : new BigNumber(0);

      return {
        year: yr,
        month: mn,
        totalRevenue: this.toString(revenue),
        totalPayments: count,
        averageOrderValue: this.toString(avgValue),
      };
    });

    // Sort by year, then month
    return stats.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
        if (a.month == null && b.month == null) return 0;
      if (a.month === null) return -1;
      if (b.month === null) return 1;
      return a.month - b.month;
    });
  }

  /**
   * Group payments by year and month
   */
  private groupPayments(
    payments: PaymentTransaction[],
    month?: number
  ): Record<string, PaymentTransaction[]> {
    return payments.reduce((acc, payment) => {
      const created = new Date(payment.createdAt);
      const year = created.getFullYear();
      const monthValue = created.getMonth() + 1; // getMonth() returns 0-11

      const key = month !== undefined && month !== null
        ? `${year}-${monthValue}`
        : `${year}`;

      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(payment);

      return acc;
    }, {} as Record<string, PaymentTransaction[]>);
  }

  /**
   * Filter payment by year
   */
  private filterByYear(payment: PaymentTransaction, year?: number): boolean {
    if (year === undefined || year === null) return true;
    const paymentYear = new Date(payment.createdAt).getFullYear();
    return paymentYear === year;
  }

  /**
   * Filter payment by month
   */
  private filterByMonth(payment: PaymentTransaction, month?: number): boolean {
    if (month === undefined || month === null) return true;
    const paymentMonth = new Date(payment.createdAt).getMonth() + 1; // getMonth() returns 0-11
    return paymentMonth === month;
  }
}