export interface UpdateLoyaltyRequest {
  points: number;
  bookingId: string; // UUID
  bookingCode: string;
  amountSpent: string; // numeric as string
  description?: string;
}
