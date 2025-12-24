import amqp, { connect } from "amqplib";
import { randomUUID } from "crypto";

// RabbitConfig constants
export const RabbitConfig = {
  // Exchanges
  SHOWTIME_EXCHANGE: "showtime.exchange",
  BOOKING_EXCHANGE: "booking.exchange",

  // Routing keys
  SEAT_UNLOCK_ROUTING_KEY: "seat.unlocked",
  BOOKING_CONFIRMED_KEY: "booking.confirmed",
  BOOKING_CANCELLED_KEY: "booking.cancelled",
  BOOKING_EXPIRED_KEY: "booking.expired",
  BOOKING_REFUNDED_KEY: "booking.refunded",
  SEAT_RELEASE_REQUEST_KEY: "seat.release.request",
  BOOKING_SEAT_MAPPED_KEY: "booking.seat.mapped",

  // Queues
  SHOWTIME_QUEUE: "showtime.queue",
};

// Generic EventMessage interface
export interface EventMessage<T> {
  id: string;
  type: string;
  version: string;
  timestamp: string; // ISO string
  data: T;
}
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;

export class ShowtimeProducer {
  private connection!: AmqpConnection;
  private channel!: AmqpChannel;
  private isConnected = false;

  constructor(private url: string = "amqp://localhost") {
  }
  private async init() {
    if (this.isConnected) return;

    this.connection = await connect(this.url);
    this.channel = await this.connection.createChannel();

    // Assert exchanges
    await this.channel.assertExchange(RabbitConfig.SHOWTIME_EXCHANGE, "direct", { durable: true });
    await this.channel.assertExchange(RabbitConfig.BOOKING_EXCHANGE, "direct", { durable: true });

    this.isConnected = true;
    console.info("ShowtimeProducer connected");
  }

  private buildMessage<T>(type: string, data: T): EventMessage<T> {
    return {
      id: randomUUID(),
      type,
      version: "v1",
      timestamp: new Date().toISOString(),
      data,
    };
  }

  /**
   * Send SeatUnlocked event
   */
  public async sendSeatUnlockedEvent<T>(data: T): Promise<void> {
    if(!this.isConnected) await this.init();
    const msg = this.buildMessage("SeatUnlocked", data);

    await this.channel.publish(
      RabbitConfig.SHOWTIME_EXCHANGE,
      RabbitConfig.SEAT_UNLOCK_ROUTING_KEY,
      Buffer.from(JSON.stringify(msg)),
      { contentType: "application/json" }
    );
    console.info("SeatUnlocked event sent:", msg);
  }

  /**
   * Send ShowtimeSuspended event
   */
  public async sendShowtimeSuspendedEvent<T>(data: T): Promise<void> {
    if(!this.isConnected) await this.init();
    const msg = this.buildMessage("ShowtimeSuspended", data);

    await this.channel.publish(
      RabbitConfig.SHOWTIME_EXCHANGE,
      "showtime.suspended",
      Buffer.from(JSON.stringify(msg)),
      { contentType: "application/json" }
    );
    console.info("ShowtimeSuspended event sent:", msg);
  }
}
