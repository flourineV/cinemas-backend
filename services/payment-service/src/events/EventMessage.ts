export interface EventMessage<T> {
  eventId: string;
  type: string;
  version: string;
  occurredAt: Date;
  data: T;
}