import { PaymentStatus } from "../../models/PaymentStatus.js";

export interface PaymentTransactionResponse {
  id: string;             // UUID
  bookingId?: string;     // UUID
  userId: string;         // UUID
  showtimeId?: string;    // UUID
  seatIds?: string[];     // List<UUID>
  amount: string;         // BigDecimal as string
  method: string;
  status: PaymentStatus;
  transactionRef: string;
  createdAt: Date;
  updatedAt: Date;
}
