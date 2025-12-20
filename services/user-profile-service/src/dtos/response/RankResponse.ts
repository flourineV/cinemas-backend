import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(timezone);

export class RankResponse {
  id: string;
  name: string;
  minPoints: number;
  maxPoints: number;
  discountRate: number;
  createdAt: string;
  updatedAt: string;

  constructor(
    id: string,
    name: string,
    minPoints: number,
    maxPoints: number,
    discountRate: number,
    createdAt: Date,
    updatedAt: Date
  ) {
    this.id = id;
    this.name = name;
    this.minPoints = minPoints;
    this.maxPoints = maxPoints;
    this.discountRate = discountRate;

    // format ngay trong constructor
    this.createdAt = dayjs(createdAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");

    this.updatedAt = dayjs(updatedAt)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
  }
}
