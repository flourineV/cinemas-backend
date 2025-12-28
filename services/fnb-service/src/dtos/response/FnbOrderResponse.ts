import { FnbOrderItemResponse } from "./FnbOrderItemResponse";

export interface FnbOrderResponse {
  id: string;
  userId: string;
  theaterId: string;
  orderCode: string;
  totalAmount: string;
  status: string;
  paymentMethod: string;
  createdAt: Date;
  expiresAt: Date | null;
  items: FnbOrderItemResponse[];
}
