import { DataSource } from "typeorm";
import type { ShowtimeSeatResponse } from "../dto/response/ShowtimeSeatResponse.js";
import type { ShowtimeSeatsLayoutResponse } from "../dto/response/ShowtimeSeatsLayoutResponse.js";
import type { UpdateSeatStatusRequest } from "../dto/request/UpdateSeatStatusRequest.js";
import { Seat } from "../models/Seat.js";
import { Showtime } from "../models/Showtime.js";
import { ShowtimeSeat} from "../models/ShowtimeSeat.js";
import { ShowtimeStatus} from "../models/enums/ShowtimeStatus.js";
import { SeatStatus } from "../models/enums/SeatStatus.js";

export class ShowtimeSeatService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  /**
   * Lấy layout ghế theo showtimeId
   */
  public async getSeatsByShowtime(showtimeId: string): Promise<ShowtimeSeatsLayoutResponse> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    const showtime = await showtimeRepo.findOne({
      where: { id: showtimeId },
      relations: ["room"],
    });
    if (!showtime) throw new Error("Showtime not found");
    if (showtime.status === ShowtimeStatus.SUSPENDED) {
      throw new Error("Cannot get seats for a suspended showtime");
    }

    // Lấy danh sách ghế (mapping sang response DTO)
    const seats = await showtimeSeatRepo.find({
      where: { showtime: { id: showtimeId } },
      relations: ["seat"],
    });

    const seatResponses: ShowtimeSeatResponse[] = seats.map((ss) => ({
      seatId: ss.seat.id,
      seatNumber: ss.seat.seatNumber,
      type: ss.seat.type,
      status: ss.status,
    }));

    // Tính layout metadata từ seatNumber (A1, B5, ...)
    const totalSeats = seatResponses.length;
    const maxRow = seatResponses
      .map((s) => s.seatNumber)
      .filter((sn) => sn)
      .map((sn) => sn.charAt(0))
      .map((c) => c.charCodeAt(0) - "A".charCodeAt(0) + 1)
      .reduce((a, b) => Math.max(a, b), 0);

    const maxColumn = seatResponses
      .map((s) => s.seatNumber)
      .filter((sn) => sn && sn.length > 1)
      .map((sn) => parseInt(sn.substring(1)))
      .reduce((a, b) => Math.max(a, b), 0);

    return {
      totalSeats,
      totalRows: maxRow,
      totalColumns: maxColumn,
      seats: seatResponses,
    };
  }

  /**
   * Cập nhật trạng thái ghế
   */
  public async updateSeatStatus(request: UpdateSeatStatusRequest): Promise<ShowtimeSeatResponse> {
    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    const seat = await showtimeSeatRepo.findOne({
      where: {
        showtime: { id: request.showtimeId },
        seat: { id: request.seatId },
      },
      relations: ["seat", "showtime"],
    });

    if (!seat) throw new Error("Seat not found for this showtime");
    seat.status = request.status;
    seat.updatedAt = new Date();

    const saved = await showtimeSeatRepo.save(seat);
    return this.toResponse(saved);
  }

  /**
   * Khởi tạo ghế cho nhiều suất chiếu
   */
  public async batchInitializeSeats(showtimeIds: string[]): Promise<number> {
    let count = 0;
    for (const showtimeId of showtimeIds) {
      try {
        await this.initializeSeatsForShowtime(showtimeId);
        count++;
      } catch (e: any) {
        console.error(`Failed to initialize seats for showtime ${showtimeId}: ${e.message}`);
      }
    }
    return count;
  }

  /**
   * Khởi tạo ghế cho 1 suất chiếu
   */
  public async initializeSeatsForShowtime(showtimeId: string): Promise<void> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const seatRepo = this.dataSource.getRepository(Seat);
    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    const showtime = await showtimeRepo.findOne({
      where: { id: showtimeId },
      relations: ["room"],
    });
    if (!showtime) throw new Error("Showtime not found");

    const roomId = showtime.room.id;
    const seats = await seatRepo.find({ where: { room: { id: roomId } } });

    const showtimeSeats = seats.map((s) => {
      const ss = new ShowtimeSeat();
      ss.showtime = showtime;
      ss.seat = s;
      ss.status = SeatStatus.AVAILABLE;
      ss.updatedAt = new Date();
      return ss;
    });

    await showtimeSeatRepo.save(showtimeSeats);
  }

  /**
   * Khởi tạo ghế cho các suất chiếu trong khoảng ngày
   */
  public async initializeSeatsByDateRange(startDate: Date, endDate: Date): Promise<number> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setDate(end.getDate() + 1);
    end.setHours(0, 0, 0, 0);

    // giả định bạn có custom query findShowtimesWithoutSeats
    const showtimes = await showtimeRepo
      .createQueryBuilder("showtime")
      .leftJoin("showtime.seats", "seats")
      .where("showtime.startTime >= :start AND showtime.startTime < :end", { start, end })
      .andWhere("seats.id IS NULL")
      .getMany();

    let count = 0;
    for (const st of showtimes) {
      await this.initializeSeatsForShowtime(st.id);
      count++;
    }
    return count;
  }

  private toResponse(seat: ShowtimeSeat): ShowtimeSeatResponse {
    return {
      seatId: seat.seat.id,
      seatNumber: seat.seat.seatNumber,
      type: seat.seat.type,
      status: seat.status,
    };
  }
}
