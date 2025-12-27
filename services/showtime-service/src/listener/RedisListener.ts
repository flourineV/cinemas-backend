import { createClient } from "redis";
import { SeatLockService } from "../services/SeatLockService.js";

const redisUrl = process.env.REDIS_URL;

export class RedisKeyExpirationListener {
  private subscriber;
  private seatLockService: SeatLockService;

  constructor(seatLockService: SeatLockService) {
    this.seatLockService = seatLockService;
    this.subscriber = createClient(redisUrl?{ url: redisUrl }:{});
  }

  async start(): Promise<void> {
    await this.subscriber.connect();

    // Subscribe to keyevent notifications for expired keys
    await this.subscriber.pSubscribe("__keyevent@0__:expired", async (expiredKey: string) => {
      if (expiredKey.startsWith("seat:")) {
        console.warn("Lock key expired:", expiredKey);

        try {
          const parts = expiredKey.split(":");
          if (parts.length < 3) return;

          const showtimeId = parts[1];
          const seatId = parts[2];

          await this.seatLockService.handleExpiredLock(showtimeId!, seatId!);
        } catch (err: any) {
          console.error(`Error processing expired key ${expiredKey}: ${err.message}`);
        }
      }
    });

    console.info("RedisKeyExpirationListener started.");
  }
}
