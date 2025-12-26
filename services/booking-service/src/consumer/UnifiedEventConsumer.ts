import type { Channel, ConsumeMessage } from 'amqplib';
import { RabbitConfig } from '../config/RabbitConfig.js';
import { BookingService } from '../services/BookingService.js';
import type { PaymentBookingFailedEvent } from '../events/payment/PaymentBookingFailedEvent.js'
import type { PaymentBookingSuccessEvent } from '../events/payment/PaymentBookingSuccessEvent.js';
import type { SeatUnlockedEvent } from '../events/showtime/SeatUnlockedEvent.js';
import type {ShowtimeSuspendedEvent} from '../events/showtime/ShowtimeSuspendedEvent.js'

/**
 * Create and start a unified event consumer that listens on the booking queue.
 *
 * @param channel amqplib Channel already connected to RabbitMQ
 * @param bookingService instance implementing the handlers used below
 */
export default async function createUnifiedEventConsumer(
  channel: Channel,
  bookingService: BookingService
): Promise<void> {
  // Ensure queue exists (idempotent)
  await channel.assertQueue(RabbitConfig.BOOKING_QUEUE, { durable: true });

  console.info(`UnifiedEventConsumer: waiting for messages on queue=${RabbitConfig.BOOKING_QUEUE}`);

  await channel.consume(
    RabbitConfig.BOOKING_QUEUE,
    async (msg: ConsumeMessage | null) => {
      if (!msg) {
        return;
      }

      const routingKey = msg.fields.routingKey;
      console.info(`Received unified event | RoutingKey: ${routingKey}`);

      let raw: any;
      try {
        const content = msg.content.toString('utf8');
        raw = JSON.parse(content);
      } catch (err) {
        console.warn('Failed to parse message body as JSON, rejecting message', err);
        // malformed message, ack to remove from queue
        channel.ack(msg);
        return;
      }

      const dataObj = raw?.data;
      if (dataObj == null) {
        console.warn(`Payload 'data' is missing for RoutingKey: ${routingKey}`);
        channel.ack(msg);
        return;
      }

      try {
        switch (routingKey) {
          case RabbitConfig.SEAT_UNLOCK_ROUTING_KEY: {
            const data = dataObj as SeatUnlockedEvent;
            console.info('SeatUnlocked received:', JSON.stringify(data));
            // bookingService.handleSeatUnlocked may be sync or async
            await bookingService.handleSeatUnlocked(data);
            break;
          }

          case RabbitConfig.PAYMENT_BOOKING_SUCCESS_KEY: {
            const data = dataObj as PaymentBookingSuccessEvent;
            console.info(`Processing PaymentBookingSuccess for booking ${data.bookingId}`);
            // Skip if bookingId is null (FnB standalone order) — service can decide
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
            // cast to any if service expects a different shape
            await bookingService.handleShowtimeSuspended(data as any);
            break;
          }

          default: {
            console.warn('Unknown routing key:', routingKey);
            break;
          }
        }

        // Acknowledge successful processing
        channel.ack(msg);
      } catch (err: any) {
        // Log and nack without requeue to avoid poison message loops.
        // If you want retries, consider implementing a DLX/retry mechanism.
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
}
