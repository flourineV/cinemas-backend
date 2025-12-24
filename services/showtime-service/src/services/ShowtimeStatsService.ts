import { DataSource } from "typeorm";
import { Showtime } from "../models/Showtime.js";
import { ShowtimeStatus } from "../models/enums/ShowtimeStatus.js";
import type { ShowtimeStatsResponse } from "../dto/response/ShowtimeStatsResponse.js";

export class ShowtimeStatsService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Lấy overview thống kê suất chiếu theo theaterId (nếu có)
   */
  public async getOverview(theaterId?: string): Promise<ShowtimeStatsResponse> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);

    let showtimes: Showtime[];
    if (theaterId) {
      showtimes = await showtimeRepo.find({
        where: { theater: { id: theaterId } },
        relations: ["theater"],
      });
    } else {
      showtimes = await showtimeRepo.find({ relations: ["theater"] });
    }

    const total = showtimes.length;
    const now = new Date();

    const active = showtimes.filter(
      (s) => s.status === ShowtimeStatus.ACTIVE && s.startTime > now
    ).length;

    const suspended = showtimes.filter(
      (s) => s.status === ShowtimeStatus.SUSPENDED
    ).length;

    const upcoming = showtimes.filter((s) => s.startTime > now).length;

    return {
      totalShowtimes: total,
      activeShowtimes: active,
      suspendedShowtimes: suspended,
      upcomingShowtimes: upcoming,
    };
  }
}
