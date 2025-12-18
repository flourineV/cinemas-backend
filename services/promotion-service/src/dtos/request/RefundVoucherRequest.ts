export class RefundVoucherRequest {
  userId: string;
  value: string;
  expiredAt: string; // LocalDateTime -> ISO datetime string

  constructor(userId: string, value: string, expiredAt: Date) {
    this.userId = userId;
    this.value = value;
    this.expiredAt = expiredAt.toISOString();
    // giữ nguyên ý nghĩa LocalDateTime, khi serialize sẽ ra dạng "yyyy-MM-dd'T'HH:mm:ss"
  }
}
