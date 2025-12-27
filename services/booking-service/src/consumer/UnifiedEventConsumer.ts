import amqp from 'amqplib';
import type { Channel, ConsumeMessage } from 'amqplib';
import { RabbitConfig } from '../config/RabbitConfig.js';
import { BookingService } from '../services/BookingService.js';
import type { PaymentBookingFailedEvent } from '../events/payment/PaymentBookingFailedEvent.js';
import type { PaymentBookingSuccessEvent } from '../events/payment/PaymentBookingSuccessEvent.js';
import type { SeatUnlockedEvent } from '../events/showtime/SeatUnlockedEvent.js';
import type { ShowtimeSuspendedEvent } from '../events/showtime/ShowtimeSuspendedEvent.js';

/**
 * Types for convenience
 */
type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>;
const RABBIT_URL = process.env.RABBIT_URL ?? "amqp://localhost:5672";
/**
 * Create RabbitMQ connection with retry logic
 */
async function createRabbitConnection(url: string, retries = 5, delay = 3000): Promise<AmqpConnection> {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(url);
      console.log("[RabbitMQ] ✅ Connected");
      return conn;
    } catch (err: any) {
      console.warn(`[RabbitMQ] ❌ Connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("RabbitMQ connection failed after retries");
}

/**
 * Start the unified consumer with reconnect support
 */
export async function startUnifiedEventConsumer(bookingService: BookingService, url: string = RABBIT_URL) {
  try {
    const connection = await createRabbitConnection(url);
    const channel = await connection.createChannel();

    // Optional: handle unexpected connection close
    connection.on("close", async () => {
      console.warn("[RabbitMQ] Connection closed, reconnecting in 5s...");
      setTimeout(() => startUnifiedEventConsumer(bookingService, url), 5000);
    });

    connection.on("error", (err) => {
      console.error("[RabbitMQ] Connection error:", err.message);
    });

    // ====== Original consumer logic ======
    await channel.assertQueue(RabbitConfig.BOOKING_QUEUE, { durable: true });

    console.info(`UnifiedEventConsumer: waiting for messages on queue=${RabbitConfig.BOOKING_QUEUE}`);

    await channel.consume(
      RabbitConfig.BOOKING_QUEUE,
      async (msg: ConsumeMessage | null) => {
        if (!msg) return;

        const routingKey = msg.fields.routingKey;
        console.info(`Received unified event | RoutingKey: ${routingKey}`);

        let raw: any;
        try {
          const content = msg.content.toString('utf8');
          raw = JSON.parse(content);
        } catch (err) {
          console.warn('Failed to parse message body as JSON, rejecting message', err);
          channel.ack(msg);
          return;
        }

        const dataObj = raw?.data;
        if (!dataObj) {
          console.warn(`Payload 'data' is missing for RoutingKey: ${routingKey}`);
          channel.ack(msg);
          return;
        }

        try {
          switch (routingKey) {
            case RabbitConfig.SEAT_UNLOCK_ROUTING_KEY: {
              const data = dataObj as SeatUnlockedEvent;
              console.info('SeatUnlocked received:', JSON.stringify(data));
              await bookingService.handleSeatUnlocked(data);
              break;
            }
            case RabbitConfig.PAYMENT_BOOKING_SUCCESS_KEY: {
              const data = dataObj as PaymentBookingSuccessEvent;
              console.info(`Processing PaymentBookingSuccess for booking ${data.bookingId}`);
              await bookingService.handlePaymentSuccess(data);
              break;
            }
            case RabbitConfig.PAYMENT_BOOKING_FAILED_KEY: {
              const data = dataObj as PaymentBookingFailedEvent;
              console.info(`Processing PaymentFailed for booking ${data.bookingId}`);
              await bookingService.handlePaymentFailed(data);
              break;
            }
            case RabbitConfig.SHOWTIME_SUSPENDED_KEY: {
              const data = dataObj as ShowtimeSuspendedEvent;
              console.info(`Processing ShowtimeSuspended for showtime ${data.showtimeId}`);
              await bookingService.handleShowtimeSuspended(data as any);
              break;
            }
            default:
              console.warn('Unknown routing key:', routingKey);
          }

          channel.ack(msg);
        } catch (err: any) {
          console.error(`Error processing event (RK: ${routingKey}):`, err?.message ?? err, err);
          try {
            channel.nack(msg, false, false);
          } catch (nackErr) {
            console.error('Failed to nack message:', nackErr);
          }
        }
      },
      { noAck: false }
    );
    // ====== End of original consumer logic ======

  } catch (err) {
    console.error("[UnifiedConsumer] ❌ Failed to start consumer:", err);
    // Retry after 5 seconds
    setTimeout(() => startUnifiedEventConsumer(bookingService, url), 5000);
  }
}
