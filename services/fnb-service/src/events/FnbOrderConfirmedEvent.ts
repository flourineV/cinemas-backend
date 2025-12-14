// FnbOrderConfirmedEvent - Sent to Notification Service
export interface FnbOrderConfirmedEvent {
  fnbOrderId: string;
  userId: string;
  orderCode: string;
  theaterId?: string; // Optional - not in database schema but used in Java code
  totalAmount: string;
  items: FnbItemDetail[];
}

export interface FnbItemDetail {
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}

