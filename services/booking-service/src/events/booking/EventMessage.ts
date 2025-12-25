export interface EventMessage<T> {
  eventId: string;
  type: string;
  version: string;
  occurredAt: string; // ISO timestamp
  data: T;
}
