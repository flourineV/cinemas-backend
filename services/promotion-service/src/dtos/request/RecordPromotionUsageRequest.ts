export class RecordPromotionUsageRequest {
  userId: string;
  promotionCode: string;
  bookingId: string;

  constructor(userId: string, promotionCode: string, bookingId: string) {
    this.userId = userId;
    this.promotionCode = promotionCode;
    this.bookingId = bookingId;
  }
}
