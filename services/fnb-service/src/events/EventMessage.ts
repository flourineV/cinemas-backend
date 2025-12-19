export class EventMessage<T> {
  eventType: string;
  data: T;

  constructor(type: string, data: T) {
    this.eventType = type;
    this.data = data;
  }
}
