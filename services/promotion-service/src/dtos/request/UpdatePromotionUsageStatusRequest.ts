import { BookingStatus } from "../../models/UsedPromotion.entity";

export class UpdatePromotionUsageStatusRequest {
  bookingId: string;
  bookingStatus: BookingStatus;

  constructor(bookingId: string, bookingStatus: BookingStatus) {
    this.bookingId = bookingId;
    this.bookingStatus = bookingStatus;
  }
}
