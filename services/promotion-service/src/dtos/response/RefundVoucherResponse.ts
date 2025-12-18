import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class RefundVoucherResponse {
  id: string;
  code: string;
  userId: string;
  value: string;
  isUsed: boolean;
  createdAt: string;
  expiredAt: string;

  constructor(
    id: string,
    code: string,
    userId: string,
    value: string,
    isUsed: boolean,
    createdAt: Date,
    expiredAt: Date
  ) {
    this.id = id;
    this.code = code;
    this.userId = userId;
    this.value = value;
    this.isUsed = isUsed;
    this.createdAt = dayjs(createdAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
    this.expiredAt = dayjs(expiredAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
