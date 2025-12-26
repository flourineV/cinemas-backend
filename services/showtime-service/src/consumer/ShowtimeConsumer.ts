import amqp from "amqplib";
import type { ConsumeMessage } from "amqplib";

import { SeatLockService } from "../services/SeatLockService.js";
import type {
  BookingSeatMappedEvent,
  BookingStatusUpdatedEvent,
  EventMessage,
} from "../events/events.js";
import { RabbitConfig } from "../producer/ShowtimeProducer.js";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>;

export class ShowtimeConsumer {
  private connection?: AmqpConnection;
  private channel?: AmqpChannel;
  private readonly seatLockService: SeatLockService;
  private readonly amqpUrl: string;
  private isReconnecting = false;

  constructor(seatLockService: SeatLockService, amqpUrl: string) {
    if (!amqpUrl) {
      throw new Error("AMQP URL is required");
    }

    this.seatLockService = seatLockService;
    this.amqpUrl = amqpUrl;
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.amqpUrl);

      // Handle connection errors
      this.connection.on("error", (err) => {
        console.error("RabbitMQ connection error:", err);
      });

      this.connection.on("close", () => {
        console.warn("RabbitMQ connection closed");
        if (!this.isReconnecting) {
          this.reconnect();
        }
      });

      this.channel = await this.connection.createChannel();

      // Handle channel errors
      this.channel.on("error", (err) => {
        console.error("RabbitMQ channel error:", err);
      });

      this.channel.on("close", () => {
        console.warn("RabbitMQ channel closed");
      });

      // Assert exchange
      await this.channel.assertExchange(
        RabbitConfig.SHOWTIME_EXCHANGE,
        "topic",
        { durable: true }
      );

      // Assert queue
      await this.channel.assertQueue(RabbitConfig.SHOWTIME_QUEUE, {
        durable: true,
      });

      // Bind specific routing keys
      const routingKeys = [
        RabbitConfig.BOOKING_SEAT_MAPPED_KEY,
        RabbitConfig.BOOKING_CONFIRMED_KEY,
        RabbitConfig.BOOKING_CANCELLED_KEY,
        RabbitConfig.BOOKING_EXPIRED_KEY,
        RabbitConfig.BOOKING_REFUNDED_KEY,
      ];

      for (const key of routingKeys) {
        await this.channel.bindQueue(
          RabbitConfig.SHOWTIME_QUEUE,
          RabbitConfig.SHOWTIME_EXCHANGE,
          key
        );
      }

      console.info("ShowtimeConsumer connected to RabbitMQ");
      this.isReconnecting = false;
    } catch (error) {
      console.error("Failed to connect to RabbitMQ:", error);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.isReconnecting) return;

    this.isReconnecting = true;
    console.info("Reconnecting to RabbitMQ in 5 seconds...");

    setTimeout(async () => {
      try {
        await this.connect();
        await this.start();
      } catch (error) {
        console.error("Reconnection failed:", error);
        this.isReconnecting = false;
        this.reconnect();
      }
    }, 5000);
  }

  async start(): Promise<void> {
    if (!this.channel) {
      await this.connect();
    }

    if (!this.channel) {
      throw new Error("Failed to initialize channel");
    }

    // Set prefetch to avoid overload
    await this.channel.prefetch(10);

    await this.channel.consume(
      RabbitConfig.SHOWTIME_QUEUE,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        try {
          const routingKey = msg.fields.routingKey;

          const raw = JSON.parse(msg.content.toString()) as EventMessage<unknown>;

          console.info(`Received message with routing key: ${routingKey}`);

          switch (routingKey) {
            case RabbitConfig.BOOKING_SEAT_MAPPED_KEY: {
              const event = raw.data as BookingSeatMappedEvent;
              console.info(
                "Processing SEAT_MAPPED event. bookingId=%s, showtimeId=%s",
                event.bookingId,
                event.showtimeId
              );
              await this.seatLockService.mapBookingIdToSeatLocks(event);
              break;
            }

            case RabbitConfig.BOOKING_CONFIRMED_KEY: {
              const event = raw.data as BookingStatusUpdatedEvent;
              console.info(
                "Processing BOOKING_CONFIRMED event. bookingId=%s",
                event.bookingId
              );
              await this.seatLockService.confirmBookingSeats(event);
              break;
            }

            case RabbitConfig.BOOKING_CANCELLED_KEY:
            case RabbitConfig.BOOKING_EXPIRED_KEY:
            case RabbitConfig.BOOKING_REFUNDED_KEY: {
              const event = raw.data as BookingStatusUpdatedEvent;
              console.info(
                "Processing BOOKING_RELEASE event. bookingId=%s, status=%s",
                event.bookingId,
                event.newStatus
              );
              await this.seatLockService.releaseSeatsByBookingStatus(event);
              break;
            }

            default:
              console.warn("Unknown routing key:", routingKey);
          }

          this.channel!.ack(msg);
          console.info(`Message acknowledged: ${routingKey}`);
        } catch (error) {
          console.error("Failed to process message:", error);
          // Reject without requeue to avoid infinite loop
          this.channel!.nack(msg, false, false);
        }
      },
      { noAck: false }
    );

    console.info("ShowtimeConsumer started and listening for messages");
  }

  async close(): Promise<void> {
    try {
      await this.channel?.close();
      await this.connection?.close();
      console.info("ShowtimeConsumer closed gracefully");
    } catch (error) {
      console.error("Error closing ShowtimeConsumer:", error);
    }
  }
}