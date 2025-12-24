import { DataSource } from "typeorm";
import { Showtime } from "../models/Showtime.js";
import { ShowtimeStatus } from "../models/enums/ShowtimeStatus.js";
import type { ShowtimeSuspendedEvent } from "../events/events.js";
import { ShowtimeProducer } from "../producer/ShowtimeProducer.js";

export class ShowtimeStatusService {
  private dataSource: DataSource;
  private showtimeProducer: ShowtimeProducer;

  constructor(dataSource: DataSource, showtimeProducer: ShowtimeProducer) {
    this.dataSource = dataSource;
    this.showtimeProducer = showtimeProducer;
  }

  /**
   * Suspend all active showtimes for a movie (when movie is archived).
   * Returns the number of showtimes suspended.
   */
  public async suspendShowtimesByMovie(movieId: string, reason: string): Promise<number> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);
    const now = new Date();

    // Find all ACTIVE showtimes for this movie in the future
    const showtimes = await showtimeRepo.find({
      where: { movieId, status: ShowtimeStatus.ACTIVE },
    });

    const futureShowtimes = showtimes.filter((s) => s.startTime > now);

    if (futureShowtimes.length === 0) {
      console.info(`No active showtimes found for movie ${movieId}`);
      return 0;
    }

    let count = 0;
    for (const showtime of futureShowtimes) {
      showtime.status = ShowtimeStatus.SUSPENDED;
      await showtimeRepo.save(showtime);

      // Build suspension event
      const event: ShowtimeSuspendedEvent = {
        showtimeId: showtime.id,
        movieId,
        affectedBookingIds: [], // booking-service will resolve affected bookings
        reason,
      };

      await this.showtimeProducer.sendShowtimeSuspendedEvent(event);

      console.info(`Showtime ${showtime.id} suspended. Reason: ${reason}`);
      count++;
    }

    console.info(`Suspended ${count} showtimes for movie ${movieId}. Reason: ${reason}`);
    return count;
  }

  /**
   * Suspend a specific showtime by ID.
   */
  public async suspendShowtime(showtimeId: string, reason: string): Promise<void> {
    const showtimeRepo = this.dataSource.getRepository(Showtime);

    const showtime = await showtimeRepo.findOne({ where: { id: showtimeId } });
    if (!showtime) {
      throw new Error(`Showtime not found: ${showtimeId}`);
    }

    if (showtime.status === ShowtimeStatus.SUSPENDED) {
      throw new Error("Showtime already suspended");
    }

    showtime.status = ShowtimeStatus.SUSPENDED;
    await showtimeRepo.save(showtime);

    const event: ShowtimeSuspendedEvent = {
      showtimeId,
      movieId: showtime.movieId,
      affectedBookingIds: [],
      reason,
    };

    await this.showtimeProducer.sendShowtimeSuspendedEvent(event);

    console.info(`Showtime ${showtimeId} suspended. Reason: ${reason}`);
  }
}
