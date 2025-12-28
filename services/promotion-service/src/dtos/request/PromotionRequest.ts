import {
  IsNotEmpty,
  IsString,
  MaxLength,
  IsEnum,
  IsNumber,
  Min,
  IsDate,
  IsOptional,
  IsBoolean,
} from "class-validator";
import {
  PromotionType,
  UsageTimeRestriction,
} from "../../models/Promotion.entity";
import { DiscountType } from "../../models/DiscountType";

export class PromotionRequest {
  @IsNotEmpty({ message: "Mã khuyến mãi không được để trống." })
  @IsString()
  @MaxLength(50, { message: "Mã khuyến mãi không được quá 50 ký tự." })
  code: string;

  @IsOptional()
  @IsEnum(PromotionType)
  promotionType?: PromotionType;

  @IsNotEmpty({ message: "Loại chiết khấu không được để trống." })
  @IsEnum(DiscountType)
  discountType: DiscountType;

  @IsNotEmpty({ message: "Giá trị chiết khấu không được để trống." })
  @IsNumber()
  @Min(0, { message: "Giá trị chiết khấu phải lớn hơn hoặc bằng 0." })
  discountValue: string;

  @IsNotEmpty({ message: "Ngày bắt đầu không được để trống." })
  @IsDate()
  startDate: Date;

  @IsNotEmpty({ message: "Ngày kết thúc không được để trống." })
  @IsDate()
  endDate: Date;

  @IsBoolean()
  @IsOptional()
  isActive: boolean = true;

  @IsOptional()
  @IsEnum(UsageTimeRestriction)
  usageTimeRestriction?: UsageTimeRestriction;

  @IsOptional()
  @IsString()
  allowedDaysOfWeek?: string; // e.g., "SATURDAY,SUNDAY"

  @IsOptional()
  @IsString()
  allowedDaysOfMonth?: string; // e.g., "1,2,3,15,20"

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "Mô tả không được quá 500 ký tự." })
  description: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: "URL ảnh không được quá 500 ký tự." })
  promoDisplayUrl: string;

  constructor(
    code: string,
    promotionType: PromotionType,
    discountType: DiscountType,
    discountValue: string,
    startDate: Date,
    endDate: Date,
    isActive: boolean = true,
    usageTimeRestriction: UsageTimeRestriction,
    allowedDaysOfWeek: string,
    allowedDaysOfMonth: string,
    description: string,
    promoDisplayUrl: string
  ) {
    this.code = code;
    this.promotionType = promotionType;
    this.discountType = discountType;
    this.discountValue = discountValue;
    this.startDate = startDate;
    this.endDate = endDate;
    this.isActive = isActive;
    this.usageTimeRestriction = usageTimeRestriction;
    this.allowedDaysOfWeek = allowedDaysOfWeek;
    this.allowedDaysOfMonth = allowedDaysOfMonth;
    this.description = description;
    this.promoDisplayUrl = promoDisplayUrl;
  }
}
