// ShowtimeGenerationHelper.ts
import { DataSource } from "typeorm";
import { MovieServiceClient, movieServiceClient } from "../client/MovieServiceClient.js";
import type { ShowtimeAutoGenerateConfig } from "../config/showtimeAutoGenerateConfig.js";
import type { MovieSummaryResponse } from "../client/MovieSummaryResponse.js";
import type { GenerationStats } from "../dto/model/GenerationStats.js";


import { TimeSlot } from "../dto/model/TimeSlot.js";
import { Room } from "../models/Room.js";
import { Showtime } from "../models/Showtime.js";
import { Theater } from "../models/Theater.js";
import { ShowtimeStatus } from "../models/enums/ShowtimeStatus.js";

export class ShowtimeGenerationHelper {
  private dataSource: DataSource;
  private movieServiceClient: MovieServiceClient;
  private config: ShowtimeAutoGenerateConfig;
  
  constructor(
    dataSource: DataSource,
    movieServiceClient: MovieServiceClient,
    config: ShowtimeAutoGenerateConfig,) 
    {
    this.dataSource = dataSource;
    this.movieServiceClient = movieServiceClient;
    this.config = config;
  }

  /**
   * Đảm bảo ít nhất 1 suất cho mỗi phim trong danh sách movies.
   * Cố gắng xếp phim vào các phòng theo First Fit (lần lượt).
   */
  public async ensureOneShowtimePerMovie(
    date: Date,
    theater: Theater,
    rooms: Room[],
    movies: MovieSummaryResponse[],
    stats: GenerationStats
  ): Promise<void> {
    const roomCount = rooms.length;
    let movieIndex = 0;

    for (const movie of movies) {
      let assigned = false;
      for (let i = 0; i < roomCount; i++) {
        const room = rooms[(movieIndex + i) % roomCount];
        try {
          const ok = await this.tryScheduleSingleSlot(date, theater, room!, movie, stats);
          if (ok) {
            assigned = true;
            break;
          }
        } catch (err: any) {
          console.log("Error scheduling single slot: %s", err?.message ?? err);
        }
      }
      if (!assigned) {
        console.log("Could not assign guaranteed slot for movie: %s", movie.title);
      }
      movieIndex++;
    }
  }

  /**
   * Sinh suất cho 1 phòng trong ngày targetDate dựa trên weightedMoviePool.
   */
  public async generateForRoom(
    targetDate: Date,
    theater: Theater,
    room: Room,
    weightedMoviePool: MovieSummaryResponse[],
    stats: GenerationStats
  ): Promise<void> {
    const dayStart = new Date(targetDate);
    dayStart.setHours(this.config.startHour, 0, 0, 0);

    let dayEnd: Date;
    if (this.config.endHour === 24) {
      dayEnd = new Date(targetDate);
      dayEnd.setDate(dayEnd.getDate() + 1);
      dayEnd.setHours(0, 0, 0, 0);
    } else {
      dayEnd = new Date(targetDate);
      dayEnd.setHours(this.config.endHour, 0, 0, 0);
    }

    // Lấy existing showtimes trong vùng mở rộng (để tính gap)
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const existingShowtimes = await showtimeRepo.find({
      where: {
        room: { id: room.id },
        // We'll filter by times manually because TypeORM where with ranges depends on your entity fields
      },
      order: { startTime: "ASC" },
    });

    // Filter existing to those overlapping extended window
    const extendedStart = new Date(dayStart);
    extendedStart.setHours(extendedStart.getHours() - 4);
    const extendedEnd = new Date(dayEnd);
    extendedEnd.setHours(extendedEnd.getHours() + 4);

    const existing = existingShowtimes.filter((st) => {
      return st.endTime > extendedStart && st.startTime < extendedEnd;
    }).sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    // Calculate free slots
    let freeSlots = this.calculateFreeSlots(dayStart, dayEnd, existing);

    console.log("Room %s: Found %d free slots, %d existing showtimes",
      room.name, freeSlots.length, existing.length);

    let safetyCounter = 0;
    let slotsProcessed = 0;
    let showtimesCreated = 0;

    // Use simple priority: sort by start ascending and process from earliest
    freeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());

    while (freeSlots.length > 0 && safetyCounter < 500) {
      safetyCounter++;
      const currentSlot = freeSlots.shift()!;
      slotsProcessed++;

      if (currentSlot.getDurationMinutes() < 60) {
        console.log("Slot too short: %d minutes", currentSlot.getDurationMinutes());
        continue;
      }

      const selectedMovie = this.selectMovieStrategy(currentSlot, weightedMoviePool, 0);

      if (selectedMovie) {
        const duration = selectedMovie.time ?? 120;
        const showStart = new Date(currentSlot.start);
        const showEnd = new Date(showStart.getTime() + duration * 60 * 1000);

        await this.createShowtimeEntity(selectedMovie, theater, room, showStart, showEnd, stats);
        showtimesCreated++;

        const nextAvailableStart = this.roundUpToNearestInterval(
          new Date(showEnd.getTime() + this.config.cleaningGapMinutes * 60 * 1000),
          5
        );

        if (nextAvailableStart < currentSlot.end) {
          // push new slot for remaining time
          freeSlots.push(new TimeSlot(nextAvailableStart, currentSlot.end));
          // keep queue sorted
          freeSlots.sort((a, b) => a.start.getTime() - b.start.getTime());
        }
      } else {
        console.log("No movie fits slot: %s - %s", currentSlot.start.toISOString(), currentSlot.end.toISOString());
      }
    }

    console.log("Room %s: Processed %d slots, created %d showtimes",
      room.name, slotsProcessed, showtimesCreated);
  }

  /**
   * Thử xếp 1 suất cho movie vào phòng room trong ngày date (First Fit).
   */
  private async tryScheduleSingleSlot(
    date: Date,
    theater: Theater,
    room: Room,
    movie: MovieSummaryResponse,
    stats: GenerationStats
  ): Promise<boolean> {
    const dayStart = new Date(date);
    dayStart.setHours(this.config.startHour, 0, 0, 0);

    let dayEnd: Date;
    if (this.config.endHour === 24) {
      dayEnd = new Date(date);
      dayEnd.setDate(dayEnd.getDate() + 1);
      dayEnd.setHours(0, 0, 0, 0);
    } else {
      dayEnd = new Date(date);
      dayEnd.setHours(this.config.endHour, 0, 0, 0);
    }

    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const existingShowtimes = await showtimeRepo.find({
      where: { room: { id: room.id } },
      order: { startTime: "ASC" },
    });

    const extendedStart = new Date(dayStart);
    extendedStart.setHours(extendedStart.getHours() - 4);
    const extendedEnd = new Date(dayEnd);
    extendedEnd.setHours(extendedEnd.getHours() + 4);

    const existing = existingShowtimes.filter((st) => st.endTime > extendedStart && st.startTime < extendedEnd)
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime());

    const slots = this.calculateFreeSlots(dayStart, dayEnd, existing);
    const duration = movie.time ?? 120;

    for (const slot of slots) {
      if (slot.getDurationMinutes() >= duration) {
        const start = new Date(slot.start);
        const end = new Date(start.getTime() + duration * 60 * 1000);
        await this.createShowtimeEntity(movie, theater, room, start, end, stats);
        return true;
      }
    }
    return false;
  }

  /**
   * Tính các khoảng trống giữa các showtime hiện có trong khoảng [start, end).
   */
  private calculateFreeSlots(start: Date, end: Date, existing: Showtime[]): TimeSlot[] {
    const slots: TimeSlot[] = [];
    if (!existing || existing.length === 0) {
      slots.push(new TimeSlot(start, end));
      return slots;
    }

    let cursor = new Date(start);

    for (const st of existing) {
      if (cursor < st.startTime) {
        slots.push(new TimeSlot(new Date(cursor), new Date(st.startTime)));
      }
      const next = new Date(st.endTime.getTime() + this.config.cleaningGapMinutes * 60 * 1000);
      cursor = this.roundUpToNearestInterval(next, 5);
    }

    if (cursor < end) {
      slots.push(new TimeSlot(cursor, end));
    }

    return slots;
  }

  /**
   * Chọn phim cho slot: giờ vàng -> chọn theo popularity; giờ thường -> random weighted.
   */
  private selectMovieStrategy(slot: TimeSlot, pool: MovieSummaryResponse[], poolIndex: number): MovieSummaryResponse | null {
    if (this.isPrimeTime(slot.start)) {
      return this.findBestPopularMovieForSlot(slot, pool);
    }
    return this.findRandomMovieForSlot(slot, pool);
  }

  private isPrimeTime(time: Date): boolean {
    const hour = time.getHours();
    return hour >= this.config.primeTimeStartHour && hour < this.config.primeTimeEnd;
  }

  private findBestPopularMovieForSlot(slot: TimeSlot, pool: MovieSummaryResponse[]): MovieSummaryResponse | null {
    // unique by id
    const map = new Map<string, MovieSummaryResponse>();
    for (const m of pool) {
      if (!map.has(m.id)) map.set(m.id, m);
    }
    const unique = Array.from(map.values()).sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0));

    const topCount = Math.min(3, unique.length);
    for (let i = 0; i < topCount; i++) {
      const topMovie = unique[i];
      if (!topMovie) continue;
      if (this.canFit(topMovie, slot)) return topMovie;
    }

    for (let i = topCount; i < unique.length; i++) {
        if (!unique[i]) continue;
        if (this.canFit(unique[i]!, slot)) return unique[i]!;
    }

    return null;
  }

  private findRandomMovieForSlot(slot: TimeSlot, pool: MovieSummaryResponse[]): MovieSummaryResponse | null {
    if (!pool || pool.length === 0) return null;

    const randomIndex = Math.floor(Math.random() * pool.length);
    const randomMovie = pool[randomIndex];

    if (this.canFit(randomMovie!, slot)) return randomMovie!;
    return this.findAny(slot, pool);
  }

  private findAny(slot: TimeSlot, movies: MovieSummaryResponse[]): MovieSummaryResponse | null {
    for (const m of movies) {
      if (this.canFit(m, slot)) return m;
    }
    return null;
  }

  private canFit(m: MovieSummaryResponse, slot: TimeSlot): boolean {
    const d = m.time ?? 120;
    return d <= slot.getDurationMinutes();
  }

  /**
   * Tạo Showtime entity và lưu vào DB, cập nhật stats và gọi movieServiceClient khi cần.
   */
  private async createShowtimeEntity(
    m: MovieSummaryResponse,
    t: Theater,
    r: Room,
    start: Date,
    end: Date,
    stats: GenerationStats
  ): Promise<void> {
    try {
      const st = new Showtime();
      st.movieId = m.id;
      st.theater = t;
      st.room = r;
      st.startTime = start;
      st.endTime = end;
      st.status = ShowtimeStatus.ACTIVE;

      await this.dataSource.manager.save(Showtime, st);

      stats.totalGenerated = (stats.totalGenerated ?? 0) + 1;

      if (!stats.generatedMovies) stats.generatedMovies = [];
      if (!stats.generatedMovies.includes(m.title)) {
        stats.generatedMovies.push(m.title);
        try {
          await this.movieServiceClient.updateMovieToNowPlaying(m.id);
        } catch (err: any) {
          console.log("Failed to update movie to now playing: %s", err?.message ?? err);
        }
      }
    } catch (e: any) {
      console.log("Save error: %s", e?.message ?? e);
      if (!stats.errors) stats.errors = [];
      stats.errors.push(e?.message ?? String(e));
    }
  }

  private roundUpToNearestInterval(time: Date, intervalMinutes: number): Date {
    const minutes = time.getMinutes();
    const rem = minutes % intervalMinutes;
    if (rem === 0) return new Date(time);
    const delta = intervalMinutes - rem;
    return new Date(time.getTime() + delta * 60 * 1000);
  }
}
