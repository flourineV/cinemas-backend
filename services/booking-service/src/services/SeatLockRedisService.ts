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

    constructor(redisClient: Redis) {
        this.redis = redisClient;
    }
  
    //Validate guest session owns the seats
    async validateGuestSessionOwnsSeats(
        showtimeId: string,
        seatIds: string[],
        guestSessionId: string
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

        if (ownerType !== 'GUEST' || ownerIdentifier !== guestSessionId) {
            console.warn(
            `Guest session ${guestSessionId} does not own seat ${seatId} for showtime ${showtimeId} (owner: ${ownerType}|${ownerIdentifier})`
            );
            return false;
        }
        }
        return true;
    }

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
