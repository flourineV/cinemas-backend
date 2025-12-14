// FnbOrderCreatedEvent - Sent to Payment Service
export interface FnbOrderCreatedEvent {
  fnbOrderId: string;
  userId: string;
  totalAmount: string;
}

