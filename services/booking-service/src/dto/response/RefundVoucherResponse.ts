export interface RefundVoucherResponse {
  id: string; // UUID
  code: string;
  userId: string; // UUID
  value: string; // numeric as string
  isUsed: boolean;
  createdAt: string; // ISO string
  expiredAt: string; // ISO string
}
