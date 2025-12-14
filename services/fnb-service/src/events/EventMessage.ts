// Event Message Wrapper
export class EventMessage<T> {
  type: string;
  data: T;
  timestamp: Date;

  constructor(type: string, data: T) {
    this.type = type;
    this.data = data;
    this.timestamp = new Date();
  }
}

