import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class LoyaltyHistoryResponse {
  id: string;
  bookingId: string;
  pointsChange: number;
  pointsBefore: number;
  pointsAfter: number;
  amountSpent: string;
  description: string;
  createdAt: string;

  constructor(
    id: string,
    bookingId: string,
    pointsChange: number,
    pointsBefore: number,
    pointsAfter: number,
    amountSpent: string,
    description: string,
    createdAt: Date
  ) {
    this.id = id;
    this.bookingId = bookingId;
    this.pointsChange = pointsChange;
    this.pointsBefore = pointsBefore;
    this.pointsAfter = pointsAfter;
    this.amountSpent = amountSpent;
    this.description = description;

    // Format ngày ngay trong constructor
    this.createdAt = dayjs(createdAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
