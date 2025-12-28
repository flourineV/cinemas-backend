export interface EventMessage<T> {
  eventId: string;
  type: string;
  version: string;
  occurredAt: Date; // Instant -> Date
  data: T;
}