// src/producer/BookingProducer.ts
import { v4 as uuidv4 } from 'uuid';
import { RabbitConfig } from '../config/RabbitConfig.js';
import { publish } from '../messaging/RabbitClient.js';

import type { BookingCreatedEvent } from '../events/booking/BookingCreatedEvent.js';
import type { BookingFinalizedEvent } from '../events/booking/BookingFinalizedEvent.js';
import type { BookingStatusUpdatedEvent } from '../events/booking/BookingStatusUpdatedEvent.js';
import type { BookingSeatMappedEvent } from '../events/booking/BookingSeatMappedEvent.js';
import type { SeatUnlockedEvent } from '../events/showtime/SeatUnlockedEvent.js';
import type { BookingRefundedEvent } from '../events/booking/BookingRefundedEvent.js';
import type { BookingTicketGeneratedEvent } from '../events/notification/BookingTicketGeneratedEvent.js';
import type { EventMessage } from '../events/booking/EventMessage.js';

function makeEvent<T>(type: string, data: T): EventMessage<T> {
  return {
    eventId: uuidv4(),
    type,
    version: 'v1',
    occurredAt: new Date().toISOString(),
    data,
  };
}

/**
 * BookingProducer
 *
 * Lightweight producer that publishes booking-related events to RabbitMQ.
 * Depends on messaging.initRabbit(...) being called at app startup.
 */
export class BookingProducer {
  async sendBookingCreatedEvent(data: BookingCreatedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;
    const ROUTING_KEY = RabbitConfig.BOOKING_CREATED_KEY;

    const msg = makeEvent('BookingCreated', data);

    console.info(
      `Sending BookingCreatedEvent → PaymentService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendBookingStatusUpdatedEvent(data: BookingStatusUpdatedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;

    // determine routing key based on newStatus
    const status = data.newStatus;
    let ROUTING_KEY = 'key.booking.unknown';
    if (status === 'CONFIRMED') ROUTING_KEY = RabbitConfig.BOOKING_CONFIRMED_KEY;
    else if (status === 'CANCELLED' || status === 'CANCELED') ROUTING_KEY = RabbitConfig.BOOKING_CANCELLED_KEY;

    const msg = makeEvent('BookingStatusUpdated', data);

    console.info(
      `Sending BookingStatusUpdatedEvent → ShowtimeService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}, status=${status}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendBookingExpiredEvent(data: BookingStatusUpdatedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;
    const ROUTING_KEY = RabbitConfig.BOOKING_EXPIRED_KEY;

    const msg = makeEvent('BookingExpired', data);

    console.warn(
      `Sending BookingExpiredEvent → ShowtimeService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendBookingFinalizedEvent(data: BookingFinalizedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;
    const ROUTING_KEY = RabbitConfig.BOOKING_FINALIZED_KEY;

    const msg = makeEvent('BookingFinalized', data);

    console.info(
      `Sending BookingFinalizedEvent → PaymentService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}, finalPrice=${data.finalPrice}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendBookingRefundedEvent(data: BookingRefundedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;
    const ROUTING_KEY = RabbitConfig.BOOKING_REFUNDED_KEY;

    const msg = makeEvent('BookingRefunded', data);

    console.info(
      `Sending BookingRefundedEvent → ShowtimeService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}, refundedValue=${data.refundedValue}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendBookingSeatMappedEvent(data: BookingSeatMappedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;
    const ROUTING_KEY = RabbitConfig.BOOKING_SEAT_MAPPED_KEY;

    const msg = makeEvent('BookingSeatMapped', data);

    console.info(
      `📤 Sending BookingSeatMappedEvent → ShowtimeService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendSeatUnlockedEvent(data: SeatUnlockedEvent) {
    const EXCHANGE = RabbitConfig.SHOWTIME_EXCHANGE;
    const ROUTING_KEY = RabbitConfig.BOOKING_SEAT_UNLOCK_KEY;

    const msg = makeEvent('SeatUnlocked', data);

    console.warn(
      `📤 Sending SeatUnlockedEvent (REQUEST) → ShowtimeService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}, reason=${data.reason}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }

  async sendBookingTicketGeneratedEvent(data: BookingTicketGeneratedEvent) {
    const EXCHANGE = RabbitConfig.BOOKING_EXCHANGE;
    const ROUTING_KEY = 'booking.ticket.generated';

    const msg = makeEvent('BookingTicketGenerated', data);

    console.info(
      `Sending BookingTicketGeneratedEvent → NotificationService | exchange=${EXCHANGE}, routingKey=${ROUTING_KEY}, bookingId=${data.bookingId}`
    );

    await publish(EXCHANGE, ROUTING_KEY, msg);
  }
}
