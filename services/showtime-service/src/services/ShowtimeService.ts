import { DataSource, Between, LessThan, MoreThan, In } from 'typeorm';
import { Showtime } from '../models/Showtime.js';
import { Theater } from '../models/Theater.js';
import { Room } from '../models/Room.js';
import type { ShowtimeRequest } from '../dto/request/ShowtimeRequest.js';
import type { BatchShowtimeRequest } from '../dto/request/BatchShowtimeRequest.js';
import type { ValidateShowtimeRequest } from '../dto/request/ValidateShowtimeRequest.js';
import type { ShowtimeResponse } from '../dto/response/ShowtimeResponse.js';
import type { BatchShowtimeResponse } from '../dto/response/BatchShowtimeResponse.js';
import type { ShowtimeConflictResponse } from '../dto/response/ShowtimeConflictResponse.js';
import type { ShowtimesByMovieResponse } from '../dto/response/ShowtimesByMovieResponse.js';
import type { TheaterScheduleResponse } from '../dto/response/TheaterScheduleResponse.js';
import type { MovieShowtimesResponse } from '../dto/response/MovieShowtimesResponse.js';
import type { TheaterShowtimesResponse } from '../dto/response/TheaterShowtimesResponse.js';
import type { MovieWithTheatersResponse } from '../dto/response/MovieWithTheatersResponse.js';
import type  { PagedResponse } from '../dto/response/PagedResponse.js';
import type { ShowtimeDetailResponse } from '../dto/response/ShowtimeDetailResponse.js';
import type { AutoGenerateShowtimesResponse } from '../dto/response/AutoGenerateShowtimesResponse.js';
import { MovieServiceClient } from '../client/MovieServiceClient.js';
import { ShowtimeMapper } from '../mappers/ShowtimeMapper.js';
import { ShowtimeGenerationHelper } from '../helper/ShowtimeGenerationHelper.js';
import { ShowtimeStatus } from '../models/enums/ShowtimeStatus.js';
import type { GenerationStats } from '../dto/model/GenerationStats.js';

export class ShowtimeService {
  constructor(
    private dataSource: DataSource,
    private movieServiceClient: MovieServiceClient,
    private showtimeMapper: ShowtimeMapper,
    private generationHelper: ShowtimeGenerationHelper
  ) {}

  async createShowtime(request: ShowtimeRequest): Promise<ShowtimeResponse> {
    const theaterRepo = this.dataSource.getRepository(Theater);
    const roomRepo = this.dataSource.getRepository(Room);
    const showtimeRepo = this.dataSource.getRepository(Showtime);

    const theater = await theaterRepo.findOne({ where: { id: request.theaterId } });
    if (!theater) {
      throw new Error('Theater not found');
    }

    const room = await roomRepo.findOne({ where: { id: request.roomId } });
    if (!room) {
      throw new Error('Room not found');
    }

    await this.checkOverlap(request.roomId, new Date(request.startTime), new Date(request.endTime), null);

    const showtime = showtimeRepo.create({
      movieId: request.movieId,
      theater,
      room,
      startTime: new Date(request.startTime),
      endTime: new Date(request.endTime),
      status: ShowtimeStatus.ACTIVE
    });

    const saved = await showtimeRepo.save(showtime);

    // Update movie to NOW_PLAYING if UPCOMING
    try {
      await this.movieServiceClient.updateMovieToNowPlaying(request.movieId);
    } catch (error) {
      console.warn(`Failed to update movie ${request.movieId} to NOW_PLAYING`, error);
    }

    return this.showtimeMapper.toShowtimeResponse(saved);
  }

  async updateShowtime(id: string, request: ShowtimeRequest): Promise<ShowtimeResponse> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const theaterRepo = this.dataSource.getRepository(Theater);
    const roomRepo = this.dataSource.getRepository(Room);

    const showtime = await showtimeRepo.findOne({ where: { id } });
    if (!showtime) {
      throw new Error('Showtime not found');
    }

    const theater = await theaterRepo.findOne({ where: { id: request.theaterId } });
    if (!theater) {
      throw new Error('Theater not found');
    }

    const room = await roomRepo.findOne({ where: { id: request.roomId } });
    if (!room) {
      throw new Error('Room not found');
    }

    await this.checkOverlap(request.roomId, new Date(request.startTime), new Date(request.endTime), id);

    showtime.movieId = request.movieId;
    showtime.theater = theater;
    showtime.room = room;
    showtime.startTime = new Date(request.startTime);
    showtime.endTime = new Date(request.endTime);

    const updated = await showtimeRepo.save(showtime);
    return this.showtimeMapper.toShowtimeResponse(updated);
  }

  async deleteShowtime(id: string): Promise<void> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const exists = await showtimeRepo.exists({ where: { id } });
    if (!exists) {
      throw new Error('Showtime not found');
    }
    await showtimeRepo.delete(id);
  }

  async getShowtimeById(id: string): Promise<ShowtimeResponse> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const showtime = await showtimeRepo.findOne({ 
      where: { id },
      relations: ['theater', 'room']
    });

    if (!showtime) {
      throw new Error('Showtime not found');
    }

    return this.showtimeMapper.toShowtimeResponse(showtime);
  }

  async getAllShowtimes(): Promise<ShowtimeResponse[]> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const showtimes = await showtimeRepo.find({ relations: ['theater', 'room'] });
    return showtimes.map(st => this.showtimeMapper.toShowtimeResponse(st));
  }

  async getShowtimesByTheaterAndDate(
    theaterId: string,
    start: Date,
    end: Date
  ): Promise<ShowtimeResponse[]> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const showtimes = await showtimeRepo.find({
      where: {
        theater: { id: theaterId },
        startTime: Between(start, end)
      },
      relations: ['theater', 'room']
    });

    return showtimes.map(st => this.showtimeMapper.toShowtimeResponse(st));
  }

  async getShowtimesByMovie(movieId: string): Promise<ShowtimeResponse[]> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const showtimes = await showtimeRepo.find({
      where: { movieId },
      relations: ['theater', 'room']
    });

    return showtimes.map(st => this.showtimeMapper.toShowtimeResponse(st));
  }

   /**
   * Get showtimes for a movie grouped by date (next 5 days) and by theater.
   */
  public async getShowtimesByMovieGrouped(movieId: string): Promise<ShowtimesByMovieResponse> {
    // today (date-only)
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // build targetDates: today + next 4 days
    const targetDates: Date[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() + i);
      targetDates.push(d);
    }

    // fetch all showtimes for movieId where startTime >= today, include theater & room relations
    const allShowtimes: Showtime[] = await this.dataSource
      .createQueryBuilder(Showtime, "s")
      .leftJoinAndSelect("s.theater", "theater")
      .leftJoinAndSelect("s.room", "room")
      .where("s.movieId = :movieId", { movieId })
      .andWhere("s.startTime >= :today", { today: today.toISOString() })
      .getMany();

    // fetch all theaters
    const allTheaters: Theater[] = await this.dataSource.getRepository(Theater).find();

    // group showtimes by date (yyyy-mm-dd) then by theaterId
    const groupedData: Map<string, Map<string, Showtime[]>> = new Map();
    for (const st of allShowtimes) {
      const stDate = new Date(st.startTime);
      const dateKey = stDate.toISOString().slice(0, 10); // YYYY-MM-DD
      const theaterId = (st.theater && (st.theater.id as any))?.toString() ?? "";

      if (!groupedData.has(dateKey)) groupedData.set(dateKey, new Map());
      const byTheater = groupedData.get(dateKey)!;
      if (!byTheater.has(theaterId)) byTheater.set(theaterId, []);
      byTheater.get(theaterId)!.push(st);
    }

    // build scheduleByDate: use a plain object keyed by ISO date string (or Date[] if DTO expects Date)
    const scheduleByDate: Record<string, TheaterScheduleResponse[]> = {};

    for (const date of targetDates) {
      const dateKey = date.toISOString().slice(0, 10);
      const showtimesOnDate = groupedData.get(dateKey) ?? new Map<string, Showtime[]>();

      const dailySchedules: TheaterScheduleResponse[] = allTheaters.map((theater) => {
        const theaterId = (theater.id as any).toString();
        const theaterShowtimes = showtimesOnDate.get(theaterId) ?? [];

        // sort by startTime
        theaterShowtimes.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        // map to DTOs using mapper
        const showtimeDtos: ShowtimeResponse[] = theaterShowtimes.map((st) => this.showtimeMapper.toShowtimeResponse(st));

        return {
          theaterId: theater.id,
          theaterName: theater.name,
          theaterAddress: theater.address,
          showtimes: showtimeDtos,
        } as TheaterScheduleResponse;
      });

      scheduleByDate[dateKey] = dailySchedules;
    }

    // Build response
    const response: ShowtimesByMovieResponse = {
      availableDates: targetDates.map(d => d.toISOString()), // nếu DTO mong string dates, caller can convert; giữ Date[] cho tính linh hoạt
      scheduleByDate,
    };

    return response;
  }

  /**
   * Get movies (and their upcoming showtimes) for a given theater.
   */
  public async getMoviesByTheater(theaterId: string): Promise<MovieShowtimesResponse[]> {
    const now = new Date();

    // fetch showtimes for theater where startTime > now, include room relation
    const showtimes: Showtime[] = await this.dataSource
      .createQueryBuilder(Showtime, "s")
      .leftJoinAndSelect("s.room", "room")
      .where("s.theaterId = :theaterId", { theaterId })
      .andWhere("s.startTime > :now", { now: now.toISOString() })
      .getMany();

    // group by movieId
    const mapByMovie = new Map<string, Showtime[]>();
    for (const s of showtimes) {
      const movieKey = (s.movieId as any).toString();
      if (!mapByMovie.has(movieKey)) mapByMovie.set(movieKey, []);
      mapByMovie.get(movieKey)!.push(s);
    }

    // map to response
    const result: MovieShowtimesResponse[] = [];
    for (const [movieId, movieShowtimes] of mapByMovie.entries()) {
      const showtimeInfos = movieShowtimes.map((s) => ({
        showtimeId: s.id,
        roomId: s.room?.id,
        roomName: s.room?.name,
        startTime: s.startTime,
        endTime: s.endTime,
        status: (s.status ?? "").toString(),
      }));

      result.push({
        movieId,
            showtimes: showtimeInfos.map(s => ({
            ...s,
            startTime: s.startTime.toISOString(),
            endTime: s.endTime.toISOString(),
        })),
      } as MovieShowtimesResponse);
    }

    return result;
  }
  /**
   * Get theater showtimes grouped by theater for a given movie and province.
   */
  public async getTheaterShowtimesByMovieAndProvince(movieId: string, provinceId: string): Promise<TheaterShowtimesResponse[]> {
    const now = new Date();

    // fetch showtimes where movieId and theater.provinceId = provinceId and startTime > now
    const showtimes: Showtime[] = await this.dataSource
      .createQueryBuilder(Showtime, "s")
      .leftJoinAndSelect("s.theater", "theater")
      .leftJoinAndSelect("s.room", "room")
      .where("s.movieId = :movieId", { movieId })
      .andWhere("theater.provinceId = :provinceId", { provinceId })
      .andWhere("s.startTime > :now", { now: now.toISOString() })
      .getMany();

    // group by theater id
    const byTheater = new Map<string, Showtime[]>();
    for (const s of showtimes) {
      const tid = (s.theater?.id as any)?.toString() ?? "";
      if (!byTheater.has(tid)) byTheater.set(tid, []);
      byTheater.get(tid)!.push(s);
    }

    const responses: TheaterShowtimesResponse[] = [];
    for (const [theaterId, theaterShowtimes] of byTheater.entries()) {
      if (theaterShowtimes.length === 0) continue;
      const theater = theaterShowtimes[0]!.theater as Theater;

      // sort by startTime
      theaterShowtimes.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      // map to showtime info DTO using mapper if available
      const showtimeInfos = theaterShowtimes.map((s) => {
        if (this.showtimeMapper && typeof this.showtimeMapper.toShowtimeInfo === "function") {
          return this.showtimeMapper.toShowtimeInfo(s);
        }
        // fallback mapping shape (compatible with expected DTO)
        return {
          showtimeId: s.id,
          roomId: s.room?.id,
          roomName: s.room?.name,
          startTime: s.startTime,
          endTime: s.endTime,
          status: (s.status ?? "").toString(),
        };
      });

      responses.push({
        theaterId: theater.id,
        theaterName: theater.name,
        theaterAddress: theater.address,
        theaterImageUrl: theater.theaterImageUrl,
        showtimes: showtimeInfos,
      } as TheaterShowtimesResponse);
    }

    return responses;
  }

  /**
   * Lấy danh sách movies kèm theaters và showtimes theo ngày (filter movieId/theaterId tùy chọn)
   */
  public async getMoviesWithTheatersByDate(
    date: Date,
    movieId?: string | null,
    theaterId?: string | null
  ): Promise<MovieWithTheatersResponse[]> {
    // startOfDay / endOfDay
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Build base query
    const qb = this.dataSource
      .createQueryBuilder(Showtime, "s")
      .leftJoinAndSelect("s.theater", "theater")
      .leftJoinAndSelect("s.room", "room")
      .where("s.startTime BETWEEN :startOfDay AND :endOfDay", {
        startOfDay: startOfDay.toISOString(),
        endOfDay: endOfDay.toISOString(),
      });

    if (movieId) {
      qb.andWhere("s.movieId = :movieId", { movieId });
    }
    if (theaterId) {
      qb.andWhere("s.theaterId = :theaterId", { theaterId });
    }

    const now = new Date();
    qb.andWhere("s.startTime > :now", { now: now.toISOString() });

    const showtimes = await qb.getMany();

    // Group by movieId
    const byMovie = new Map<string, Showtime[]>();
    for (const s of showtimes) {
      const key = (s.movieId as any).toString();
      if (!byMovie.has(key)) byMovie.set(key, []);
      byMovie.get(key)!.push(s);
    }

    const result: MovieWithTheatersResponse[] = [];

    for (const [movieKey, movieShowtimes] of byMovie.entries()) {
      // Group by theater
      const byTheater = new Map<string, Showtime[]>();
      for (const s of movieShowtimes) {
        const tid = (s.theater?.id as any)?.toString() ?? "";
        if (!byTheater.has(tid)) byTheater.set(tid, []);
        byTheater.get(tid)!.push(s);
      }

      const theaters = Array.from(byTheater.entries())
        .map(([tid, theaterShowtimes]) => {
          // sort showtimes by startTime
          theaterShowtimes.sort(
            (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
          );

          const showtimeDetails = theaterShowtimes.map((st) => ({
            showtimeId: st.id,
            roomName: st.room?.name,
            startTime: st.startTime,
            endTime: st.endTime,
          }));

          const theater = theaterShowtimes[0]!.theater as Theater;

          return {
            theaterId: theater.id,
            theaterName: theater.name,
            theaterNameEn: (theater as any).nameEn,
            theaterAddress: theater.address,
            theaterAddressEn: (theater as any).addressEn,
            showtimes: showtimeDetails.map(s => ({
                ...s,
                startTime: s.startTime.toISOString(), 
                endTime: s.endTime.toISOString(),     
            })),
            } as MovieWithTheatersResponse["theaters"][0];
        })
        .sort((a, b) => {
          const na = (a.theaterName ?? "").toString();
          const nb = (b.theaterName ?? "").toString();
          return na.localeCompare(nb);
        });

      result.push({
        movieId: movieKey,
        theaters,
      } as MovieWithTheatersResponse);
    }

    return result;
  }

  async getAllAvailableShowtimes(
    provinceId?: string,
    theaterId?: string,
    roomId?: string,
    movieId?: string,
    showtimeId?: string,
    startOfDay?: Date,
    endOfDay?: Date,
    fromTime?: string,
    toTime?: string,
    page: number = 1,
    size: number = 10,
    sortBy?: string,
    sortType: 'asc' | 'desc' = 'asc'
  ): Promise<PagedResponse<ShowtimeDetailResponse>> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const now = new Date();

    let query = showtimeRepo
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.theater', 'theater')
      .leftJoinAndSelect('showtime.room', 'room')
      .where('showtime.startTime > :now', { now });

    if (provinceId) {
      query = query.andWhere('theater.provinceId = :provinceId', { provinceId });
    }
    if (theaterId) {
      query = query.andWhere('theater.id = :theaterId', { theaterId });
    }
    if (roomId) {
      query = query.andWhere('room.id = :roomId', { roomId });
    }
    if (movieId) {
      query = query.andWhere('showtime.movieId = :movieId', { movieId });
    }
    if (showtimeId) {
      query = query.andWhere('showtime.id = :showtimeId', { showtimeId });
    }
    if (startOfDay && endOfDay) {
      query = query.andWhere('showtime.startTime BETWEEN :start AND :end', {
        start: startOfDay,
        end: endOfDay
      });
    }

    // Sorting
    const orderBy = sortBy || 'startTime';
    query = query.orderBy(`showtime.${orderBy}`, sortType.toUpperCase() as 'ASC' | 'DESC');

    // Pagination
    const skip = (page - 1) * size;
    query = query.skip(skip).take(size);

    const [showtimes, total] = await query.getManyAndCount();

    const content = showtimes.map(st => this.showtimeMapper.toShowtimeDetailResponse(st));
    const resolvedContent: ShowtimeDetailResponse[] = await Promise.all(content);
    return {
      data: resolvedContent,
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size)
    };
  }

  async createShowtimesBatch(request: BatchShowtimeRequest): Promise<BatchShowtimeResponse> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const theaterRepo = this.dataSource.getRepository(Theater);
    const roomRepo = this.dataSource.getRepository(Room);

    const createdShowtimes: ShowtimeResponse[] = [];
    const errors: string[] = [];
    const pendingShowtimes: ShowtimeRequest[] = [];

    if (!request.showtimes || request.showtimes.length === 0) {
        throw new Error("No showtimes provided");
}

    for (let index = 0; index < request.showtimes.length; index++) {
      const showtimeRequest = request.showtimes[index]!;
      const displayIndex = index + 1;

      try {
        if (showtimeRequest.startTime >= showtimeRequest.endTime) {
          throw new Error('startTime must be before endTime');
        }

        // Validate entities exist
        const theater = await theaterRepo.findOne({ 
          where: { id: showtimeRequest.theaterId } 
        });
        if (!theater) {
          throw new Error(`Theater with ID ${showtimeRequest.theaterId} not found`);
        }

        const room = await roomRepo.findOne({ 
          where: { id: showtimeRequest.roomId } 
        });
        if (!room) {
          throw new Error(`Room with ID ${showtimeRequest.roomId} not found`);
        }

        // Check overlap with existing showtimes in database
        const overlappingShowtimes = await this.findOverlappingShowtimes(
          showtimeRequest.roomId,
          new Date(showtimeRequest.startTime),
          new Date(showtimeRequest.endTime) 
        );

        if (overlappingShowtimes.length > 0) {
          if (request.skipOnConflict) {
            errors.push(`Showtime #${displayIndex} skipped: conflicts with existing showtime in database`);
            continue;
          } else {
            throw new Error(
              `Showtime #${displayIndex} overlaps with existing showtime in Room ID ${showtimeRequest.roomId}`
            );
          }
        }

        // Check overlap with previously processed showtimes in this batch
        const hasInternalConflict = pendingShowtimes.some(pending =>
          pending.roomId === showtimeRequest.roomId &&
          this.overlaps(
            new Date(pending.startTime),
            new Date(pending.endTime),
            new Date(showtimeRequest.startTime),
            new Date(showtimeRequest.endTime)
          )
        );

        if (hasInternalConflict) {
          if (request.skipOnConflict) {
            errors.push(`Showtime #${displayIndex} skipped: conflicts with previous showtime in batch`);
            continue;
          } else {
            throw new Error(`Showtime #${displayIndex} overlaps with previous showtime in batch`);
          }
        }

        // Create showtime
        const showtime = showtimeRepo.create({
          movieId: showtimeRequest.movieId,
          theater,
          room,
          startTime: showtimeRequest.startTime,
          endTime: showtimeRequest.endTime,
          status: ShowtimeStatus.ACTIVE
        });

        const savedShowtime = await showtimeRepo.save(showtime);
        createdShowtimes.push(this.mapToShowtimeResponse(savedShowtime));

        // Update movie to NOW_PLAYING
        try {
          await this.movieServiceClient.updateMovieToNowPlaying(showtimeRequest.movieId);
        } catch (ex) {
          console.warn(`Failed to update movie ${showtimeRequest.movieId} to NOW_PLAYING`, ex);
        }

        // Add to pending list for next iteration's conflict check
        pendingShowtimes.push(showtimeRequest);

      } catch (error) {
        if (request.skipOnConflict) {
          errors.push(`Showtime #${displayIndex} failed: ${(error as Error).message}`);
        } else {
          throw new Error(
            `Batch creation failed at showtime #${displayIndex}: ${(error as Error).message}`
          );
        }
      }
    }

    return {
      totalRequested: request.showtimes.length,
      successCount: createdShowtimes.length,
      failedCount: errors.length,
      createdShowtimes,
      errors
    };
  }

  async validateShowtime(request: ValidateShowtimeRequest): Promise<ShowtimeConflictResponse> {
    let overlappingShowtimes = await this.findOverlappingShowtimes(
      request.roomId,
      new Date(request.startTime),
      new Date(request.endTime)
    );

    // Exclude current showtime if updating
    if (request.excludeShowtimeId) {
      overlappingShowtimes = overlappingShowtimes.filter(
        st => st.id !== request.excludeShowtimeId
      );
    }

    if (overlappingShowtimes.length === 0) {
      return {
        hasConflict: false,
        message: 'No conflicts found',
        conflictingShowtimes: []
      };
    }

    const conflicts = overlappingShowtimes.map(st => this.mapToShowtimeResponse(st));

    return {
      hasConflict: true,
      message: `Found ${conflicts.length} conflicting showtime(s)`,
      conflictingShowtimes: conflicts
    };
  }

  async getShowtimesByRoomAndDateRange(
    roomId: string,
    start: Date,
    end: Date
  ): Promise<ShowtimeResponse[]> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const showtimes = await showtimeRepo.find({
      where: {
        room: { id: roomId },
        endTime: MoreThan(start),
        startTime: LessThan(end)
      },
      relations: ['theater', 'room']
    });

    return showtimes
      .map(st => this.mapToShowtimeResponse(st))
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }

  async autoGenerateShowtimes(
    startDate: Date,
    endDate: Date
  ): Promise<AutoGenerateShowtimesResponse> {
    console.log(`Starting auto-generation from ${startDate} to ${endDate}`);

    const availableMovies = await this.movieServiceClient.getAvailableMoviesForDateRange(
      startDate.toISOString(),
      endDate.toISOString()
    );
    
    if (availableMovies.length === 0) {
      return this.buildEmptyResponse('No movies found');
    }

    const theaterRepo = this.dataSource.getRepository(Theater);
    const theaters = await theaterRepo.find();
    
    if (theaters.length === 0) {
      return this.buildEmptyResponse('No theaters found');
    }

    const stats = {
      totalGenerated: 0,
      totalSkipped: 0,
      generatedMovies: [] as string[],
      skippedMovies: [] as string[],
      errors: [] as string[],
    };

    const daysBetween = Math.floor(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    ) + 1;

    for (let i = 0; i < daysBetween; i++) {
      const targetDate = new Date(startDate);
      targetDate.setDate(targetDate.getDate() + i);
      await this.generateForDate(targetDate, availableMovies, theaters, stats);
    }

    return this.buildSuccessResponse(stats, theaters.length, daysBetween);
  }

  // Private helper methods
  private async checkOverlap(
    roomId: string,
    newStartTime: Date,
    newEndTime: Date,
    excludedShowtimeId: string | null
  ): Promise<void> {
    let overlappingShowtimes = await this.findOverlappingShowtimes(
      roomId,
      newStartTime,
      newEndTime
    );

    if (overlappingShowtimes.length > 0) {
      if (excludedShowtimeId) {
        overlappingShowtimes = overlappingShowtimes.filter(
          st => st.id !== excludedShowtimeId
        );
      }

      if (overlappingShowtimes.length > 0) {
        throw new Error(`Showtime overlaps with an existing showtime in Room ID ${roomId}`);
      }
    }
  }

  private async findOverlappingShowtimes(
    roomId: string,
    startTime: Date,
    endTime: Date
  ): Promise<Showtime[]> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    
    return await showtimeRepo
      .createQueryBuilder('showtime')
      .leftJoinAndSelect('showtime.theater', 'theater')
      .leftJoinAndSelect('showtime.room', 'room')
      .where('showtime.roomId = :roomId', { roomId })
      .andWhere('showtime.startTime < :endTime', { endTime })
      .andWhere('showtime.endTime > :startTime', { startTime })
      .getMany();
  }

  private overlaps(start1: Date, end1: Date, start2: Date, end2: Date): boolean {
    return start1 < end2 && end1 > start2;
  }

  private mapToShowtimeResponse(showtime: Showtime): ShowtimeResponse {
    return {
      id: showtime.id,
      movieId: showtime.movieId,
      theaterName: showtime.theater.name,
      roomId: showtime.room.id,
      roomName: showtime.room.name,
      startTime: showtime.startTime.toISOString(),
      endTime: showtime.endTime.toISOString(),
      status: showtime.status || ShowtimeStatus.ACTIVE
    };
  }

    private getDateKey(date: Date): string {
        if (!date) throw new Error('Date is required');
        return date!.toISOString()!.split('T')[0]!;
    }

    private buildSuccessResponse(stats: GenerationStats, theaterCount: number, dayCount: number): AutoGenerateShowtimesResponse {
        return {
            totalGenerated: stats.totalGenerated,
            totalSkipped: stats.totalSkipped,
            generatedMovies: stats.generatedMovies,
            skippedMovies: [],
            errors: stats.errors,
            message: `Generated ${stats.totalGenerated} showtimes across ${theaterCount} theaters in ${dayCount} days`,
        };
    }

    private buildEmptyResponse(message: string): AutoGenerateShowtimesResponse {
        return {
            totalGenerated: 0,
            totalSkipped: 0,
            generatedMovies: [],
            skippedMovies: [],
            errors: [],
            message,
        };
    }
  private async generateForDate(
    date: Date,
    movies: any[],
    theaters: Theater[],
    stats: any
  ): Promise<void> {
    const todayMovies = movies.filter(m => this.isMovieAvailable(m, date));
    if (todayMovies.length === 0) return;

    const weightedPool = this.createWeightedMoviePool(todayMovies);
    const roomRepo = this.dataSource.getRepository(Room);

    for (const theater of theaters) {
      const rooms = await roomRepo.find({ where: { theater: { id: theater.id } } });
      for (const room of rooms) {
        await this.generationHelper.generateForRoom(date, theater, room, weightedPool, stats);
      }
    }
  }
    private isMovieAvailable(m: { startDate?: Date | null; endDate?: Date | null }, d: Date): boolean {
        // Nếu không có startDate => không có lịch chiếu
        if (!m.startDate) return false;

        // So sánh theo ngày: chuyển về timestamp để so sánh chính xác
        const startTime = new Date(m.startDate).setHours(0, 0, 0, 0);
        const targetTime = new Date(d).setHours(0, 0, 0, 0);

        // Nếu phim bắt đầu sau ngày d => không có sẵn
        if (startTime > targetTime) return false;

        // Nếu không có endDate => vẫn đang chiếu; nếu có endDate và endDate < d => không có sẵn
        if (!m.endDate) return true;
        const endTime = new Date(m.endDate).setHours(0, 0, 0, 0);
        return endTime >= targetTime;
    }
  private createWeightedMoviePool(movies: any[]): any[] {
    if (movies.length === 0) return [];

    const pool: any[] = [];
    const maxPop = Math.max(...movies.map(m => m.popularity || 0));
    console.log(`Generating pool. Max popularity in batch: ${maxPop}`);

    for (const movie of movies) {
      const pop = movie.popularity || 5.0;
      const weight = this.calculateDynamicWeight(pop);

      for (let i = 0; i < weight; i++) {
        pool.push(movie);
      }
    }

    // Shuffle pool
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }

    return pool;
  }

    private calculateDynamicWeight(popularity: number): number {
        if (popularity >= 18.0) return 12;
        if (popularity >= 15.0) return 10;

        if (popularity >= 12.0) return 8;
        if (popularity >= 10.0) return 6;

        if (popularity >= 8.0) return 5;
        if (popularity >= 6.0) return 4;

        if (popularity >= 4.0) return 3;

        if (popularity >= 2.0) return 2;

        return 1;
    }
}