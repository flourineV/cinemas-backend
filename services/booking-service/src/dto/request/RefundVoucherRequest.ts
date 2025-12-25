export interface RefundVoucherRequest {
  userId: string; // UUID
  value: string; // numeric as string
  expiredAt: string; // ISO string
}
