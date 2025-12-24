import { IsString, IsNumber, IsOptional } from "class-validator";

export class PromotionNotificationRequest {
  @IsString()
  promotionCode!: string;

  @IsString()
  promotionType!: string;

  @IsString()
  discountType!: string;

  @IsNumber()
  discountValue!: number; 

  @IsString()
  discountValueDisplay!: string;

  @IsString()
  description!: string;

  @IsString()
  promoDisplayUrl!: string;

  startDate!: Date;
  endDate!: Date;

  @IsOptional()
  @IsString()
  validUntil?: string;

  @IsOptional()
  @IsString()
  usageRestriction?: string;

  @IsOptional()
  @IsString()
  actionUrl?: string;
}
