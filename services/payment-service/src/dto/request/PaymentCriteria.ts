import { PaymentStatus } from "../../models/PaymentStatus.js";

export interface PaymentCriteria {
  keyword?: string; // Partial match: userId, bookingId, showtimeId, transactionRef
  userId?: string;  // UUID as string
  bookingId?: string;
  showtimeId?: string;
  transactionRef?: string;
  status?: PaymentStatus;
  method?: string;

  fromDate?: Date;
  toDate?: Date;

  minAmount?: string; // decimal as string
  maxAmount?: string; // decimal as string
}
