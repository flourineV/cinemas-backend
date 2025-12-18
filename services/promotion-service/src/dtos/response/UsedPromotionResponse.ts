import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { BookingStatus } from "../../models/UsedPromotion.entity";

dayjs.extend(utc);
dayjs.extend(timezone);

export class UsedPromotionResponse {
  id: string;
  userId: string;
  promotionCode: string;
  bookingId: string;
  bookingStatus: BookingStatus;
  usedAt: string;

  constructor(
    id: string,
    userId: string,
    promotionCode: string,
    bookingId: string,
    bookingStatus: BookingStatus,
    usedAt: Date
  ) {
    this.id = id;
    this.userId = userId;
    this.promotionCode = promotionCode;
    this.bookingId = bookingId;
    this.bookingStatus = bookingStatus;
    this.usedAt = dayjs(usedAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
