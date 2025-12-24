export interface FnbOrderConfirmedEvent {
  orderId: string;
  userId: string;
  orderCode: string;
  theaterId: string;
  totalAmount: number;
  items: FnbItemDetail[];
}

export interface FnbItemDetail {
  itemName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}
