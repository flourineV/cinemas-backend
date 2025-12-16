export interface FnbOrderConfirmedEvent {
  fnbOrderId: string;
  userId: string;
  orderCode: string;
  theaterId?: string;
  totalAmount: string;
  items: FnbItemDetail[];
}

export interface FnbItemDetail {
  name: string;
  quantity: number;
  unitPrice: string;
  totalPrice: string;
}
