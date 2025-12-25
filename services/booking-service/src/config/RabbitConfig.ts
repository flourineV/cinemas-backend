export const RabbitConfig = {
  // Exchanges
  BOOKING_EXCHANGE: 'exchange.booking',
  SHOWTIME_EXCHANGE: 'exchange.showtime',

  // Routing keys for booking exchange
  BOOKING_CREATED_KEY: 'booking.created',
  BOOKING_CONFIRMED_KEY: 'booking.confirmed',
  BOOKING_CANCELLED_KEY: 'booking.cancelled',
  BOOKING_EXPIRED_KEY: 'booking.expired',
  BOOKING_FINALIZED_KEY: 'booking.finalized',
  BOOKING_REFUNDED_KEY: 'booking.refunded',
  BOOKING_SEAT_MAPPED_KEY: 'booking.seat.mapped',

  // Showtime routing keys
  BOOKING_SEAT_UNLOCK_KEY: 'showtime.seat.unlock',
};
