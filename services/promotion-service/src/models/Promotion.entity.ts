import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";
import { DiscountType } from "./DiscountType";

export enum PromotionType {
  GENERAL = "GENERAL",
  WEEKEND = "WEEKEND",
  FIRST_TIME = "FIRST_TIME",
}

export enum UsageTimeRestriction {
  NONE = "NONE",
  WEEKEND_ONLY = "WEEKEND_ONLY",
  WEEKDAY_ONLY = "WEEKDAY_ONLY",
  MONTH_START = "MONTH_START",
  MONTH_END = "MONTH_END",
  CUSTOM_DAYS = "CUSTOM_DAYS",
}

@Entity({ name: "promotion" })
export class Promotion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "code",
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  code: string;

  @Column({
    name: "promotion_type",
    type: "enum",
    enum: PromotionType,
    default: PromotionType.GENERAL,
    nullable: false,
  })
  promotionType: PromotionType;

  @Column({
    name: "discount_type",
    type: "enum",
    enum: DiscountType,
    nullable: false,
  })
  discountType: DiscountType;

  @Column({
    name: "discount_value",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
  })
  discountValue: string;

  @Column({ name: "start_date", type: "timestamp", nullable: false })
  startDate: Date;

  @Column({ name: "end_date", type: "timestamp", nullable: false })
  endDate: Date;

  @Column({ name: "is_active", type: "boolean", nullable: false })
  isActive: boolean;

  @Column({
    name: "usage_time_restriction",
    type: "enum",
    enum: UsageTimeRestriction,
    default: UsageTimeRestriction.NONE,
    nullable: true,
  })
  usageTimeRestriction: UsageTimeRestriction;

  @Column({
    name: "allowed_days_of_week",
    type: "varchar",
    length: 50,
    nullable: true,
  })
  allowedDaysOfWeek: string;

  @Column({
    name: "allowed_days_of_month",
    type: "varchar",
    length: 100,
    nullable: true,
  })
  allowedDaysOfMonth: string;

  @Column({ name: "description", type: "varchar", length: 500, nullable: true })
  description: string;

  @Column({
    name: "promo_display_url",
    type: "varchar",
    length: 500,
    nullable: true,
  })
  promoDisplayUrl: string;

  isOneTimeUse(): boolean {
    if (!this.promotionType) {
      return false;
    }
    return this.promotionType === PromotionType.FIRST_TIME;
  }
}
