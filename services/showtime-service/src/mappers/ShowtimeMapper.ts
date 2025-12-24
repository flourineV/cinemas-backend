import { DataSource } from "typeorm";
import { Showtime } from "../models/Showtime.js";
import { Seat } from "../models/Seat.js";
import { ShowtimeSeat } from "../models/ShowtimeSeat.js";
import { MovieServiceClient } from "../client/MovieServiceClient.js";
import type { ShowtimeResponse } from "../dto/response/ShowtimeResponse.js";
import type { ShowtimeDetailResponse } from "../dto/response/ShowtimeDetailResponse.js";
import type { TheaterShowtimesResponse } from "../dto/response/TheaterShowtimesResponse.js";

/**
 * Mapper chuyển đổi entity Showtime sang các DTO response.
 * - Sử dụng DataSource để truy vấn Seat và ShowtimeSeat counts.
 * - Gọi MovieServiceClient để lấy movie title.
 *
 * Lưu ý:
 * - toShowtimeDetailResponse là async vì cần truy vấn DB và gọi service.
 * - Các trường nullable (province, nameEn, ...) được kiểm tra an toàn.
 */

export class ShowtimeMapper {
  constructor(
    private dataSource: DataSource,
    private movieServiceClient: MovieServiceClient
  ) {}

    public toShowtimeResponse(showtime: Showtime): ShowtimeResponse {
        return {
            id: showtime.id,
            movieId: showtime.movieId,
            theaterName: showtime.theater?.name ?? null,
            theaterNameEn: (showtime.theater as any)?.nameEn ?? null,
            roomId: showtime.room?.id ?? null,
            roomName: showtime.room?.name ?? null,
            roomNameEn: (showtime.room as any)?.nameEn ?? null,
            startTime: showtime.startTime.toISOString(),  // convert Date -> string
            endTime: showtime.endTime.toISOString(),      // convert Date -> string
            status: showtime.status != null ? String(showtime.status) : "ACTIVE",
        } as ShowtimeResponse;
    }


  /**
   * Map Showtime -> ShowtimeDetailResponse
   * - Đếm tổng ghế theo room
   * - Đếm ghế đã booked theo showtime
   * - Lấy movie title từ movie service
   */
  public async toShowtimeDetailResponse(showtime: Showtime): Promise<ShowtimeDetailResponse> {
    const seatRepo = this.dataSource.getRepository(Seat);
    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    const roomId = showtime.room?.id;
    // totalSeats: count seats by roomId
    const totalSeats = roomId
      ? await seatRepo.count({ where: { room: { id: roomId } } })
      : 0;

    // bookedSeats: count showtime seats with status = 'BOOKED' (tùy entity, dùng 'BOOKED' string)
    // Nếu ShowtimeSeat có enum/status khác, điều chỉnh điều kiện where tương ứng.
    const bookedSeats = await showtimeSeatRepo.count({
      where: {
        showtime: { id: showtime.id },
        status: "BOOKED",
      } as any,
    });

    // movieTitle: gọi movie service client (giả sử trả về string hoặc null)
    let movieTitle: string | null = null;
    try {
      movieTitle = await this.movieServiceClient.getMovieTitle(showtime.movieId);
    } catch (err) {
      // Nếu service lỗi, fallback null (không ném lỗi ở mapper)
      movieTitle = null;
    }

    const province = showtime.theater?.province;

    const detail: ShowtimeDetailResponse = {
      id: showtime.id,
      movieId: showtime.movieId,
      movieTitle: movieTitle ?? "Unknown Title",
      theaterId: showtime.theater?.id ?? null,
      theaterName: showtime.theater?.name ?? null,
      theaterNameEn: (showtime.theater as any)?.nameEn ?? null,
      provinceId: province?.id ?? null,
      provinceName: province?.name ?? null,
      provinceNameEn: (province as any)?.nameEn ?? null,
      roomId: showtime.room?.id ?? null,
      roomName: showtime.room?.name ?? null,
      roomNameEn: (showtime.room as any)?.nameEn ?? null,
      startTime: showtime.startTime.toISOString(),
      endTime: showtime.endTime.toISOString(),
      totalSeats,
      bookedSeats: Number(bookedSeats),
      availableSeats: totalSeats - Number(bookedSeats),
    };

    return detail;
  }

  public toShowtimeInfo(showtime: Showtime): TheaterShowtimesResponse["showtimes"][0] {
    return {
      showtimeId: showtime.id,
      roomId: showtime.room?.id ? String(showtime.room.id) : null,
      roomName: showtime.room?.name ?? null,
      startTime: showtime.startTime.toISOString(),
      endTime: showtime.endTime.toISOString(),
    } as TheaterShowtimesResponse["showtimes"][0];
  }
}
