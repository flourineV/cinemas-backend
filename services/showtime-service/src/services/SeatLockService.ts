import { DataSource } from 'typeorm';
import { ShowtimeSeat } from '../models/ShowtimeSeat.js';
import { SeatStatus } from '../models/enums/SeatStatus.js';
import { Showtime } from '../models/Showtime.js';
import { ShowtimeStatus } from '../models/enums/ShowtimeStatus.js';
import { createClient } from 'redis';
import type { SeatSelectionDetail } from '../dto/request/SeatSelectionDetail.js';
import type { SeatLockRequest } from '../dto/request/SeatLockRequest.js';
import type { SingleSeatLockRequest } from '../dto/request/SingleSeatLockRequest.js';
import type { SeatLockResponse } from '../dto/response/SeatLockResponse.js';
import type { BookingStatusUpdatedEvent } from '../events/events.js';
import type { BookingSeatMappedEvent } from '../events/events.js';
import type { SeatUnlockedEvent } from '../events/events.js';
import { ShowtimeProducer } from '../producer/ShowtimeProducer.js';
import { SeatLockWebSocketHandler } from '../websocket/SeatLockWebSocketHandler.js';
import { In } from 'typeorm';

export class SeatLockService {
  private readonly LOCK_TIMEOUT: number;
  private readonly BOOKING_MAPPING_KEY_PREFIX = 'booking_seat_map:';

  // Script to update lock value while preserving TTL
  private readonly UPDATE_LOCK_WITH_TTL_SCRIPT = `
    local ttl = redis.call('TTL', KEYS[1])
    if ttl > 0 then
      redis.call('SET', KEYS[1], ARGV[1], 'EX', ttl)
      return 1
    else
      return 0
    end
  `;

  constructor(
    private dataSource: DataSource,
    private redisClient: ReturnType<typeof createClient>,
    private showtimeProducer: ShowtimeProducer,
    private webSocketHandler: SeatLockWebSocketHandler,
    lockTimeout: number = 300 // Default 5 minutes
  ) {
    this.LOCK_TIMEOUT = lockTimeout;
  }

  async lockSingleSeat(req: SingleSeatLockRequest): Promise<SeatLockResponse> {
    const seatId = req.selectedSeat.seatId;
    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    // Validate showtime-seat combination exists
    const showtimeSeat = await showtimeSeatRepo.findOne({
      where: {
        showtime: { id: req.showtimeId },
        seat: { id: seatId }
      },
      relations: ['showtime', 'seat']
    });

    if (!showtimeSeat) {
      throw new Error(
        `Showtime or seat not found: showtimeId=${req.showtimeId}, seatId=${seatId}`
      );
    }

    const showtime = showtimeSeat.showtime;

    // Check 1: Status
    if (showtime.status === ShowtimeStatus.SUSPENDED) {
      throw new Error('Showtime is SUSPENDED. Cannot lock seat.');
    }

    // Check 2: Time - Cannot book if showtime has already started
    if (new Date(showtime.startTime) < new Date()) {
      throw new Error('Showtime has already started. Cannot lock seat.');
    }

    const key = this.buildKey(req.showtimeId, seatId);
    const expireAt = Date.now() + this.LOCK_TIMEOUT * 1000;

    const ownerType = req.userId ? 'USER' : 'GUEST';
    const ownerIdentifier = req.userId || req.guestSessionId;
    const value = `${ownerType}|${ownerIdentifier}|${expireAt}`;

    // Try to set lock in Redis with TTL using SET with NX option
    const success = await this.redisClient.set(key, value, {
      EX: this.LOCK_TIMEOUT,
      NX: true // Only set if not exists
    });

    if (!success) {
      throw new Error(`Seat ${seatId} is already locked by another user.`);
    }

    // Update database
    const updatedCount = await this.updateSingleSeatStatus(
      req.showtimeId,
      seatId,
      SeatStatus.LOCKED,
      new Date()
    );

    console.log(
      `Seat ${seatId} locked (Redis+DB) for showtime ${req.showtimeId} by ${
        req.userId ? `user ${req.userId}` : `guest ${req.guestSessionId}`
      }. DB updated: ${updatedCount}`
    );

    const response = this.buildLockResponse(
      req.showtimeId,
      seatId,
      'LOCKED',
      this.LOCK_TIMEOUT
    );

    // Broadcast WebSocket update
    await this.webSocketHandler.broadcastToShowtime(req.showtimeId, response);

    return response;
  }

  async unlockSingleSeat(
    showtimeId: string,
    seatId: string,
    userId?: string,
    guestSessionId?: string
  ): Promise<SeatLockResponse> {
    const key = this.buildKey(showtimeId, seatId);

    // Check ownership
    const currentValue = await this.redisClient.get(key);
    if (currentValue) {
      const parts = currentValue.split('|');
      if (parts.length >= 2) {
        const ownerType = parts[0];
        const ownerIdentifier = parts[1];

        let isOwner = false;
        if (ownerType === 'USER' && userId) {
          isOwner = ownerIdentifier === userId;
        } else if (ownerType === 'GUEST' && guestSessionId) {
          isOwner = ownerIdentifier === guestSessionId;
        }

        if (!isOwner) {
          throw new Error("You don't own this seat lock");
        }
      }
    }

    // Delete Redis lock
    await this.redisClient.del(key);

    // Update database
    const updatedCount = await this.updateSingleSeatStatus(
      showtimeId,
      seatId,
      SeatStatus.AVAILABLE,
      new Date()
    );

    console.log(
      `Seat ${seatId} unlocked (Redis+DB) for showtime ${showtimeId}. DB updated: ${updatedCount}`
    );

    const response = this.buildLockResponse(showtimeId, seatId, 'AVAILABLE', 0);

    // Broadcast WebSocket update
    await this.webSocketHandler.broadcastToShowtime(showtimeId, response);

    // Publish event
    const event: SeatUnlockedEvent = {
      bookingId: null,
      showtimeId,
      seatIds: [seatId],
      reason: 'Manual unlock by user'
    };
    await this.showtimeProducer.sendSeatUnlockedEvent(event);
    console.log(`Published SeatUnlockedEvent for seat ${seatId} in showtime ${showtimeId}`);

    return response;
  }

  async unlockBatchSeats(
    showtimeId: string,
    seatIds: string[],
    userId?: string,
    guestSessionId?: string
  ): Promise<SeatLockResponse[]> {
    const responses: SeatLockResponse[] = [];
    const validSeatIds: string[] = [];

    for (const seatId of seatIds) {
      const key = this.buildKey(showtimeId, seatId);

      // Check ownership
      const currentValue = await this.redisClient.get(key);
      if (currentValue) {
        const parts = currentValue.split('|');
        if (parts.length >= 2) {
          const ownerType = parts[0];
          const ownerIdentifier = parts[1];

          let isOwner = false;
          if (ownerType === 'USER' && userId) {
            isOwner = ownerIdentifier === userId;
          } else if (ownerType === 'GUEST' && guestSessionId) {
            isOwner = ownerIdentifier === guestSessionId;
          }

          if (!isOwner) {
            console.warn(`Skipping seat ${seatId} - not owned by user/guest`);
            continue;
          }
        }
      }

      // Delete Redis lock
      await this.redisClient.del(key);
      validSeatIds.push(seatId);
    }

    // Update database in bulk
    const updatedCount = await this.bulkUpdateSeatStatus(
      showtimeId,
      validSeatIds,
      SeatStatus.AVAILABLE,
      new Date()
    );

    console.log(
      `${validSeatIds.length} seats unlocked (Redis+DB) for showtime ${showtimeId}. DB updated: ${updatedCount}`
    );

    // Build responses and broadcast
    for (const seatId of validSeatIds) {
      const response = this.buildLockResponse(showtimeId, seatId, 'AVAILABLE', 0);
      responses.push(response);
      await this.webSocketHandler.broadcastToShowtime(showtimeId, response);
    }

    // Publish event
    const event: SeatUnlockedEvent = {
      bookingId: null,
      showtimeId,
      seatIds: validSeatIds,
      reason: 'Manual batch unlock by user'
    };
    await this.showtimeProducer.sendSeatUnlockedEvent(event);
    console.log(
      `Published SeatUnlockedEvent for ${validSeatIds.length} seats in showtime ${showtimeId}`
    );

    return responses;
  }

  async lockSeats(req: SeatLockRequest): Promise<SeatLockResponse[]> {
    const responses: SeatLockResponse[] = [];
    const successfullyLockedSeats: string[] = [];
    const seatIds = req.selectedSeats.map(s => s.seatId);

    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    // Validate all seats exist
    const dbSeats = await showtimeSeatRepo.find({
      where: {
        showtime: { id: req.showtimeId },
        seat: { id: In(seatIds) }
      },
      relations: ['showtime', 'seat']
    });

    if (dbSeats.length !== seatIds.length) {
      throw new Error('Some seats are invalid or do not belong to this showtime.');
    }
    if (dbSeats.length === 0) {
        throw new Error("No seats found for this showtime");
    }
    const showtime = dbSeats[0]!.showtime;

    // Check 1: Status
    if (showtime.status === ShowtimeStatus.SUSPENDED) {
      throw new Error('Showtime is SUSPENDED. Cannot lock seat.');
    }

    // Check 2: Time
    if (new Date(showtime.startTime) < new Date()) {
      throw new Error('Showtime has already started. Cannot lock seat.');
    }

    // Check if any seat is already locked or booked
    for (const seat of dbSeats) {
      if (seat.status === SeatStatus.LOCKED || seat.status === SeatStatus.BOOKED) {
        throw new Error(
          `Seat ${seat.seat.seatNumber} is already locked or booked.`
        );
      }
    }

    // Try to lock each seat in Redis
    for (const seatDetail of req.selectedSeats) {
      const seatId = seatDetail.seatId;
      const key = this.buildKey(req.showtimeId, seatId);
      const expireAt = Date.now() + this.LOCK_TIMEOUT * 1000;

      const ownerType = req.userId ? 'USER' : 'GUEST';
      const ownerIdentifier = req.userId || req.guestSessionId;
      const value = `${ownerType}|${ownerIdentifier}|${expireAt}`;

      const success = await this.redisClient.set(key, value, {
        EX: this.LOCK_TIMEOUT,
        NX: true
      });

      if (success) {
        successfullyLockedSeats.push(seatId);
        responses.push(
          this.buildLockResponse(req.showtimeId, seatId, 'LOCKED', this.LOCK_TIMEOUT)
        );
      } else {
        console.warn(
          `Seat ${seatId} of showtime ${req.showtimeId} already locked. Rolling back ${successfullyLockedSeats.length} seats.`
        );

        // Rollback previously locked seats
        await this.deleteRedisLocks(req.showtimeId, successfullyLockedSeats);

        throw new Error(
          `Seat ${seatId} is already locked by another user or session.`
        );
      }
    }

    // Update database in bulk
    const updatedCount = await this.bulkUpdateSeatStatus(
      req.showtimeId,
      seatIds,
      SeatStatus.LOCKED,
      new Date()
    );

    if (req.userId) {
      console.log(
        `All ${seatIds.length} seats locked (Redis+DB) for showtime ${req.showtimeId} by user ${req.userId}. DB updated: ${updatedCount}`
      );
    } else {
      console.log(
        `All ${seatIds.length} seats locked (Redis+DB) for showtime ${req.showtimeId} by guest ${req.guestSessionId}. DB updated: ${updatedCount}`
      );
    }

    // Broadcast WebSocket updates
    for (const seatId of successfullyLockedSeats) {
      const response = this.buildLockResponse(
        req.showtimeId,
        seatId,
        'LOCKED',
        this.LOCK_TIMEOUT
      );
      await this.webSocketHandler.broadcastToShowtime(req.showtimeId, response);
    }

    return responses;
  }

  async mapBookingIdToSeatLocks(event: BookingSeatMappedEvent): Promise<void> {
    console.log(
      `MAPPING: Received bookingId ${event.bookingId} for showtime ${event.showtimeId}. Updating Redis locks...`
    );

    const newBookingId = event.bookingId;

    for (const seatId of event.seatIds) {
      const lockKey = this.buildKey(event.showtimeId, seatId);

      const currentValue = await this.redisClient.get(lockKey);

      // Check: Lock exists and hasn't been mapped (doesn't start with bookingId)
      if (currentValue && !currentValue.startsWith(newBookingId)) {
        // New value: bookingId|userId|expireAt
        const newValue = `${newBookingId}|${currentValue}`;

        // Execute Lua script to update value and preserve TTL
        const result = await this.redisClient.eval(
          this.UPDATE_LOCK_WITH_TTL_SCRIPT,
          {
            keys: [lockKey],
            arguments: [newValue]
          }
        ) as number;

        if (result === 1) {
          const currentTTL = await this.redisClient.ttl(lockKey);
          if (currentTTL > 0) {
            const mappingKey = `${this.BOOKING_MAPPING_KEY_PREFIX}${event.showtimeId}:${seatId}`;

            // Mapping key only needs to store bookingId
            await this.redisClient.set(mappingKey, newBookingId, {
              EX: currentTTL + 60
            });
            console.log(
              `MAPPING: Created dedicated mapping key ${mappingKey} with TTL ${currentTTL + 60}s.`
            );
          }
          console.log(
            `MAPPING: Successfully mapped booking ${newBookingId} to lock ${lockKey}.`
          );
        } else {
          console.warn(
            `MAPPING: Lock ${lockKey} expired or not found before mapping booking ${newBookingId}.`
          );
        }
      } else if (!currentValue) {
        console.warn(
          `MAPPING: Lock key ${lockKey} already expired. Cannot map bookingId ${newBookingId}.`
        );
      }
    }
  }

  async confirmBookingSeats(event: BookingStatusUpdatedEvent): Promise<void> {
    if (event.newStatus !== 'CONFIRMED') {
      console.warn(`RK confirmed received but event status is ${event.newStatus}`);
      return;
    }

    // 1. Update database
    const updated = await this.bulkUpdateSeatStatus(
      event.showtimeId,
      event.seatIds,
      SeatStatus.BOOKED,
      new Date()
    );

    console.log(
      `CONFIRMED: Bulk updated ${updated} seats for booking ${event.bookingId} to BOOKED.`
    );

    // 2. Delete Redis locks (to free resources)
    await this.deleteRedisLocks(event.showtimeId, event.seatIds);

    // 3. [IMPORTANT] Broadcast that seats are now BOOKED/SOLD
    for (const seatId of event.seatIds) {
      const response = this.buildLockResponse(event.showtimeId, seatId, 'BOOKED', 0);
      await this.webSocketHandler.broadcastToShowtime(event.showtimeId, response);
    }
  }

  async releaseSeatsByBookingStatus(event: BookingStatusUpdatedEvent): Promise<void> {
    const status = event.newStatus;
    if (status !== 'CANCELLED' && status !== 'EXPIRED' && status !== 'REFUNDED') {
      console.warn(`RK cancelled/expired/refunded received but event status is ${status}`);
      return;
    }

    const updated = await this.bulkUpdateSeatStatus(
      event.showtimeId,
      event.seatIds,
      SeatStatus.AVAILABLE,
      new Date()
    );

    console.log(
      `RELEASED (Status: ${status}): Bulk updated ${updated} seats for booking ${event.bookingId}.`
    );

    // Delete Redis locks
    await this.deleteRedisLocks(event.showtimeId, event.seatIds);

    // Broadcast updates
    for (const seatId of event.seatIds) {
      const response = this.buildLockResponse(event.showtimeId, seatId, 'AVAILABLE', 0);
      await this.webSocketHandler.broadcastToShowtime(event.showtimeId, response);
    }
  }

  async releaseSeats(
    showtimeId: string,
    seatIds: string[],
    bookingId: string | null,
    reason: string
  ): Promise<SeatLockResponse[]> {
    // 1. Delete Redis locks
    await this.deleteRedisLocks(showtimeId, seatIds);

    // 2. Update database
    const updatedCount = await this.bulkUpdateSeatStatus(
      showtimeId,
      seatIds,
      SeatStatus.AVAILABLE,
      new Date()
    );

    // 3. Send event
    const event: SeatUnlockedEvent = {
      bookingId,
      showtimeId,
      seatIds,
      reason
    };
    await this.showtimeProducer.sendSeatUnlockedEvent(event);

    console.log(
      `Released ${seatIds.length} seats (Redis+DB) for showtime ${showtimeId} (Reason: ${reason}). DB updated: ${updatedCount}`
    );

    // 4. Return responses
    return seatIds.map(seatId => this.buildLockResponse(showtimeId, seatId, 'AVAILABLE', 0));
  }

  async handleExpiredLock(showtimeId: string, seatId: string): Promise<void> {
    // 1. Update database to AVAILABLE
    const updatedCount = await this.bulkUpdateSeatStatus(
      showtimeId,
      [seatId],
      SeatStatus.AVAILABLE,
      new Date()
    );

    console.log(
      `EXPIRED: Seat ${seatId} of showtime ${showtimeId} status reset to AVAILABLE. DB updated: ${updatedCount}`
    );

    const response = this.buildLockResponse(showtimeId, seatId, 'AVAILABLE', 0);
    await this.webSocketHandler.broadcastToShowtime(showtimeId, response);

    // 2. Build mapping key to get Booking ID
    const mappingKey = `${this.BOOKING_MAPPING_KEY_PREFIX}${showtimeId}:${seatId}`;

    // 3. Get Booking ID from Redis
    const bookingIdStr = await this.redisClient.get(mappingKey);

    if (bookingIdStr) {
      try {
        const bookingId = bookingIdStr;

        // 4. Send SeatUnlockedEvent to Booking Service
        console.warn(
          `TTL EXPIRED: Found mapping for Booking ${bookingId}. Sending SeatUnlockedEvent.`
        );

        const event: SeatUnlockedEvent = {
          bookingId,
          showtimeId,
          seatIds: [seatId],
          reason: 'SEAT_LOCK_EXPIRED'
        };

        await this.showtimeProducer.sendSeatUnlockedEvent(event);

        // 5. Delete mapping key to clean up Redis
        await this.redisClient.del(mappingKey);
      } catch (error) {
        console.error(`Invalid UUID format stored in Redis for key: ${mappingKey}`, error);
      }
    } else {
      console.warn(
        `Key mapping not found for expired seat lock: ${mappingKey} (Lock was likely handled by another event).`
      );
    }
  }

  async seatStatus(showtimeId: string, seatId: string): Promise<SeatLockResponse> {
    const key = this.buildKey(showtimeId, seatId);
    const exists = await this.redisClient.exists(key);
    const ttl = exists ? await this.getTTL(showtimeId, seatId) : 0;

    return {
      showtimeId,
      seatId,
      status: exists ? 'LOCKED' : 'AVAILABLE',
      ttl
    };
  }

  async extendLockForPayment(
    showtimeId: string,
    seatIds: string[],
    userId?: string,
    guestSessionId?: string
  ): Promise<void> {
    for (const seatId of seatIds) {
      const key = this.buildKey(showtimeId, seatId);
      const value = await this.redisClient.get(key);

      if (!value) {
        console.warn(
          `Seat ${seatId} is not locked. Cannot extend. Seat may have been released.`
        );
        throw new Error(`Seat ${seatId} is not locked. Cannot extend.`);
      }

      // Parse current lock to get owner info
      const parts = value.split('|');
      if (parts.length < 2) {
        throw new Error(`Invalid lock format for seat ${seatId}`);
      }

      const currentOwnerType = parts[0];
      const currentOwnerIdentifier = parts[1];

      // Extend TTL to 10 minutes (600 seconds)
      const newExpireAt = Date.now() + 600_000; // 10 minutes
      const newValue = `${currentOwnerType}|${currentOwnerIdentifier}|${newExpireAt}`;

      await this.redisClient.set(key, newValue, { EX: 600 });
      console.log(
        `Extended lock for seat ${seatId} (owner: ${currentOwnerType}/${currentOwnerIdentifier}) to 10 minutes for payment processing`
      );
    }
  }

  // Private helper methods
  private async deleteRedisLocks(showtimeId: string, seatIds: string[]): Promise<void> {
    if (seatIds.length === 0) return;

    const keys = seatIds.map(seatId => this.buildKey(showtimeId, seatId));
    const deletedCount = await this.redisClient.del(keys);
    
    console.log(
      `Deleted ${deletedCount} Redis lock keys for showtime ${showtimeId}.`
    );
  }

  private async getTTL(showtimeId: string, seatId: string): Promise<number> {
    const ttl = await this.redisClient.ttl(this.buildKey(showtimeId, seatId));
    return ttl > 0 ? ttl : 0;
  }

  private buildKey(showtimeId: string, seatId: string): string {
    return `seat:${showtimeId}:${seatId}`;
  }

  private buildLockResponse(
    showtimeId: string,
    seatId: string,
    status: string,
    ttl: number
  ): SeatLockResponse {
    return {
      showtimeId,
      seatId,
      status,
      ttl
    };
  }

  private async updateSingleSeatStatus(
    showtimeId: string,
    seatId: string,
    status: SeatStatus,
    updatedAt: Date
  ): Promise<number> {
    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    const result = await showtimeSeatRepo
      .createQueryBuilder()
      .update(ShowtimeSeat)
      .set({ status, updatedAt })
      .where('showtimeId = :showtimeId', { showtimeId })
      .andWhere('seatId = :seatId', { seatId })
      .execute();

    return result.affected || 0;
  }

  private async bulkUpdateSeatStatus(
    showtimeId: string,
    seatIds: string[],
    status: SeatStatus,
    updatedAt: Date
  ): Promise<number> {
    if (seatIds.length === 0) return 0;

    const showtimeSeatRepo = this.dataSource.getRepository(ShowtimeSeat);

    const result = await showtimeSeatRepo
      .createQueryBuilder()
      .update(ShowtimeSeat)
      .set({ status, updatedAt })
      .where('showtimeId = :showtimeId', { showtimeId })
      .andWhere('seatId IN (:...seatIds)', { seatIds })
      .execute();

    return result.affected || 0;
  }
}