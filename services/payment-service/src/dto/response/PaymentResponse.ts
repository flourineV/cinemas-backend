import { PaymentStatus } from "../../models/PaymentStatus.js";

export interface PaymentResponse {
  id: string;           // UUID
  bookingId?: string;   // UUIDa
  userId: string;       // UUID
  amount: string;       // BigDecimal as string
  method: string;
  status: PaymentStatus;
  transactionRef: string;
  createdAt: Date;
  updatedAt: Date;
}
