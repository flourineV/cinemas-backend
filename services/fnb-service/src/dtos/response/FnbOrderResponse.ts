import { FnbOrderItemResponse } from "../response/FnbOrderItemResponse";

export class FnbOrderResponse {
  id!: string;
  userId!: string;
  theaterId!: string;
  orderCode!: string;
  totalAmount!: string;
  status!: string;
  paymentMethod!: string;
  createdAt!: Date;
  items!: FnbOrderItemResponse[];
}
