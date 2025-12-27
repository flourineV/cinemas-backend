import { Booking } from '../models/Booking.js';
import { BookingStatus } from '../models/BookingStatus.js';
import type { ShowtimeClient } from '../client/ShowtimeClient.js';
import type { ShowtimeDetailResponse } from '../dto/external/ShowtimeDetailResponse.js';
import type { BookingStatsResponse } from '../dto/response/BookingStatsResponse.js';
import type { RevenueStatsResponse } from '../dto/response/RevenueStatsResponse.js';
import type { DataSource, Repository } from 'typeorm';

export class BookingStatsService {
  private bookingRepo: Repository<Booking>;
  private showtimeClient: ShowtimeClient;

  constructor(dataSource: DataSource, showtimeClient: ShowtimeClient) {
    this.bookingRepo = dataSource.getRepository(Booking);
    this.showtimeClient = showtimeClient;
  }

  /**
   * Overview stats for bookings, optionally filtered by theaterId.
   */
  async getOverview(theaterId?: string): Promise<BookingStatsResponse> {
    let allBookings: Booking[];

    if (theaterId) {
      const showtimes: ShowtimeDetailResponse[] = await this.showtimeClient.getShowtimesByFilter(
        null,
        theaterId,
        null,
        null
      );
      const validShowtimeIds = new Set(showtimes.map((s) => s.id));

      allBookings = (await this.bookingRepo.find()).filter((b) =>
        validShowtimeIds.has(b.showtimeId)
      );
    } else {
      allBookings = await this.bookingRepo.find();
    }

    const total = allBookings.length;
    const confirmed = allBookings.filter((b) => b.status === BookingStatus.CONFIRMED).length;
    const cancelled = allBookings.filter(
      (b) => b.status === BookingStatus.CANCELLED || b.status === BookingStatus.REFUNDED
    ).length;
    const pending = allBookings.filter((b) => b.status === BookingStatus.PENDING).length;

    const totalRevenue = allBookings
      .filter((b) => b.status === BookingStatus.CONFIRMED)
      .map((b) => Number(b.finalPrice))
      .reduce((acc, val) => acc + val, 0);

    return {
      totalBookings: total,
      confirmedBookings: confirmed,
      cancelledBookings: cancelled,
      pendingBookings: pending,
      totalRevenue: totalRevenue.toString(),
    };
  }

  /**
   * Revenue stats grouped by year/month, optionally filtered by theaterId or provinceId.
   */
  async getRevenueStats(
    year?: number,
    month?: number,
    theaterId?: string,
    provinceId?: string
  ): Promise<RevenueStatsResponse[]> {
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    if (year) {
      if (month) {
        startDate = new Date(year, month - 1, 1);
        endDate = new Date(year, month, 0);
      } else {
        startDate = new Date(year, 0, 1);
        endDate = new Date(year, 11, 31);
      }
    }
    if (!startDate || !endDate) {
        throw new Error('startDate or endDate is undefined');
    }
    let validShowtimeIds: Set<string> = new Set();
    if (theaterId || provinceId) {
      const showtimes: ShowtimeDetailResponse[] = await this.showtimeClient.getShowtimesByFilter(
        provinceId ?? null,
        theaterId ?? null,
        startDate.toString(),
        endDate.toString()
      );
      validShowtimeIds = new Set(showtimes.map((s) => s.id));

      if (validShowtimeIds.size === 0) {
        return [];
      }
    }

    const bookings = (await this.bookingRepo.find())
      .filter((b) => b.status === BookingStatus.CONFIRMED)
      .filter((b) => this.filterByYear(b, year))
      .filter((b) => this.filterByMonth(b, month))
      .filter((b) => validShowtimeIds.size === 0 || validShowtimeIds.has(b.showtimeId));

    const grouped: Record<string, Booking[]> = {};
    for (const b of bookings) {
      const created = b.createdAt;
      const key = month ? `${created.getFullYear()}-${created.getMonth() + 1}` : `${created.getFullYear()}`;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(b);
    }

    const responses: RevenueStatsResponse[] = Object.entries(grouped).map(([key, groupBookings]) => {
      const parts = key.split('-');
      const yr = parseInt(parts[0]!, 10);
      const mn = parts.length > 1 ? parseInt(parts[1]!, 10) : undefined;

      const revenue = groupBookings.map((b) => Number(b.finalPrice)).reduce((acc, val) => acc + val, 0);
      const count = groupBookings.length;
      const avgValue = count > 0 ? revenue / count : 0;

      return {
        year: yr,
        ...(mn !== undefined ? { month: mn } : {}),
        totalRevenue: revenue.toFixed(2),
        totalBookings: count,
        averageOrderValue: avgValue.toFixed(2),
      };
    });

    responses.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      if (!a.month) return -1;
      if (!b.month) return 1;
      return (a.month ?? 0) - (b.month ?? 0);
    });

    return responses;
  }

  private filterByYear(booking: Booking, year?: number): boolean {
    if (!year) return true;
    return booking.createdAt.getFullYear() === year;
  }

  private filterByMonth(booking: Booking, month?: number): boolean {
    if (!month) return true;
    return booking.createdAt.getMonth() + 1 === month;
  }
}
