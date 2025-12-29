import type Redis from 'ioredis';

/**
 * SeatLockRedisService
 *
 * Redis key format: seat:{showtimeId}:{seatId}
 * Redis value format:
 *   - Guest: "GUEST|{guestSessionId}|{expireAt}"
 *   - User:  "USER|{userId}|{expireAt}"
 */
export class SeatLockRedisService {
    private redis: Redis;
    private LOCK_TTL = 2 * 60 * 1000; // 2 minutes
    
    constructor(redisClient: Redis) {
        this.redis = redisClient;
    }
    /** Lock seats for a user */
  async lockSeats(showtimeId: string, seatIds: string[], userId?: string): Promise<boolean> {
    if(!userId) return false;
    const owner = `USER|${userId}`;
    const pipeline = this.redis.pipeline();

    for (const seatId of seatIds) {
      const key = `seat:${showtimeId}:${seatId}`;
      pipeline.set(key, owner, 'PX', this.LOCK_TTL, 'NX'); // NX = only set if not exists
    }

    const results = await pipeline.exec();
    // if any seat was already locked, fail
    if(!results) return false;
    return results.every(([err, res]) => res === 'OK');
  }
  
    // //Validate guest session owns the seats
    // async validateGuestSessionOwnsSeats(
    //     showtimeId: string,
    //     seatIds: string[],
    //     guestSessionId: string
    // ): Promise<boolean> {
    //     for (const seatId of seatIds) {
    //     const key = `seat:${showtimeId}:${seatId}`;
    //     const value = await this.redis.get(key);

    //     if (!value) {
    //         console.warn(`Seat lock not found for seat ${seatId} in showtime ${showtimeId}`);
    //         return false;
    //     }

    //     const parts = value.split('|');
    //     if (parts.length < 2) {
    //         console.warn(`Invalid lock value format for seat ${seatId}: ${value}`);
    //         return false;
    //     }

    //     const ownerType = parts[0];
    //     const ownerIdentifier = parts[1];

    //     if (ownerType !== 'GUEST' || ownerIdentifier !== guestSessionId) {
    //         console.warn(
    //         `Guest session ${guestSessionId} does not own seat ${seatId} for showtime ${showtimeId} (owner: ${ownerType}|${ownerIdentifier})`
    //         );
    //         return false;
    //     }
    //     }
    //     return true;
    // }

    // Validate user owns the seats
    async validateUserOwnsSeats(
        showtimeId: string,
        seatIds: string[],
        userId: string
    ): Promise<boolean> {
        for (const seatId of seatIds) {
        const key = `seat:${showtimeId}:${seatId}`;
        const value = await this.redis.get(key);

        if (!value) {
            console.warn(`Seat lock not found for seat ${seatId} in showtime ${showtimeId}`);
            return false;
        }

        const parts = value.split('|');
        if (parts.length < 2) {
            console.warn(`Invalid lock value format for seat ${seatId}: ${value}`);
            return false;
        }

        const ownerType = parts[0];
        const ownerIdentifier = parts[1];

        if (ownerType !== 'USER' || ownerIdentifier !== userId) {
            console.warn(
            `User ${userId} does not own seat ${seatId} for showtime ${showtimeId} (owner: ${ownerType}|${ownerIdentifier})`
            );
            return false;
        }
        }
        return true;
    }
}
