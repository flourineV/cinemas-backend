import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import {
  PromotionType,
  UsageTimeRestriction,
} from "../../models/Promotion.entity";
import { DiscountType } from "../../models/DiscountType";

dayjs.extend(utc);
dayjs.extend(timezone);

export class PromotionResponse {
  id: string;
  code: string;
  promotionType: PromotionType;
  discountType: DiscountType;
  discountValue: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  usageTimeRestriction: UsageTimeRestriction;
  allowedDaysOfWeek: string;
  allowedDaysOfMonth: string;
  description: string;
  promoDisplayUrl: string;

  constructor(
    id: string,
    code: string,
    promotionType: PromotionType,
    discountType: DiscountType,
    discountValue: string,
    startDate: Date,
    endDate: Date,
    isActive: boolean,
    usageTimeRestriction: UsageTimeRestriction,
    allowedDaysOfWeek: string,
    allowedDaysOfMonth: string,
    description: string,
    promoDisplayUrl: string
  ) {
    this.id = id;
    this.code = code;
    this.promotionType = promotionType;
    this.discountType = discountType;
    this.discountValue = discountValue;
    // giữ nguyên ý nghĩa @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss", timezone = "Asia/Ho_Chi_Minh")
    this.startDate = dayjs(startDate)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
    this.endDate = dayjs(endDate)
      .tz("Asia/Ho_Chi_Minh")
      .format("YYYY-MM-DD'T'HH:mm:ss");
    this.isActive = isActive;
    this.usageTimeRestriction = usageTimeRestriction;
    this.allowedDaysOfWeek = allowedDaysOfWeek ?? null;
    this.allowedDaysOfMonth = allowedDaysOfMonth ?? null;
    this.description = description ?? null;
    this.promoDisplayUrl = promoDisplayUrl ?? null;
  }
}
