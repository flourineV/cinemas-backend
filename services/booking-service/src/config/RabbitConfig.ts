export const RabbitConfig = {
  // Exchanges
  SHOWTIME_EXCHANGE: 'showtime.exchange',
  PAYMENT_EXCHANGE: 'payment.exchange',
  BOOKING_EXCHANGE: 'booking.exchange',
  NOTIFICATION_EXCHANGE: 'notification.exchange',

  // Showtime routing keys
  SEAT_UNLOCK_ROUTING_KEY: 'seat.unlocked',
  SHOWTIME_SUSPENDED_KEY: 'showtime.suspended',

  // Payment routing keys
  PAYMENT_BOOKING_SUCCESS_KEY: 'payment.booking.success',
  PAYMENT_BOOKING_FAILED_KEY: 'payment.booking.failed',

  // Booking routing keys
  BOOKING_CREATED_KEY: 'booking.created',
  BOOKING_CONFIRMED_KEY: 'booking.confirmed',
  BOOKING_CANCELLED_KEY: 'booking.cancelled',
  BOOKING_EXPIRED_KEY: 'booking.expired',
  BOOKING_SEAT_UNLOCK_KEY: 'seat.release.request',
  BOOKING_SEAT_MAPPED_KEY: 'booking.seat.mapped',
  BOOKING_FINALIZED_KEY: 'booking.finalized',
  BOOKING_REFUNDED_KEY: 'booking.refunded',

  // Notification
  BOOKING_TICKET_GENERATED_KEY: 'booking.ticket.generated',

  // Queue
  BOOKING_QUEUE: 'booking.queue',
} as const;