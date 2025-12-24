import { v4 as uuidv4 } from "uuid";

/**
 * BookingSeatMappedEvent
 */
export interface BookingSeatMappedEvent {
  bookingId: string;       // UUID string
  showtimeId: string;      // UUID string
  seatIds: string[];       // list of UUID strings
  userId: string;          // UUID string
  guestName: string;
  guestEmail: string;
}

/**
 * BookingStatusUpdatedEvent
 */
export interface BookingStatusUpdatedEvent {
  bookingId: string;
  showtimeId: string;
  seatIds: string[];
  newStatus: string;
  previousStatus: string;
}

/**
 * Generic EventMessage<T>
 */
export interface EventMessage<T> {
  eventId: string;
  type: string;
  version: string;
  occurredAt: string; // ISO timestamp
  data: T;
}

/**
 * SeatUnlockedEvent
 */
export interface SeatUnlockedEvent {
  bookingId: string | null;
  showtimeId: string;
  seatIds: string[];
  reason: string;
}

/**
 * ShowtimeSuspendedEvent
 */
export interface ShowtimeSuspendedEvent {
  showtimeId: string;
  movieId: string;
  affectedBookingIds: string[];
  reason: string;
}

/**
 * Helper to build an EventMessage<T>
 * Right before sending an event, use this to wrap the event data
 */
export function buildEventMessage<T>(type: string, data: T): EventMessage<T> {
  return {
    eventId: uuidv4(),
    type,
    version: "v1",
    occurredAt: new Date().toISOString(),
    data,
  };
}
