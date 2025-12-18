import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Unique,
} from "typeorm";

export enum BookingStatus {
  PENDING = "PENDING",
  AWAITING_PAYMENT = "AWAITING_PAYMENT",
  CONFIRMED = "CONFIRMED",
  CANCELLED = "CANCELLED",
  EXPIRED = "EXPIRED",
  REFUNDED = "REFUNDED",
}

@Entity({ name: "used_promotion" })
@Unique("uk_user_promotion_code", ["userId", "promotionCode"])
export class UsedPromotion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid", nullable: false })
  userId: string;

  @Column({
    name: "promotion_code",
    type: "varchar",
    length: 50,
    nullable: false,
  })
  promotionCode: string;

  @Column({ name: "booking_id", type: "uuid", nullable: true })
  bookingId: string;

  @Column({
    name: "booking_status",
    type: "enum",
    enum: BookingStatus,
    nullable: true,
  })
  bookingStatus: BookingStatus;

  @CreateDateColumn({
    name: "used_at",
    type: "timestamp",
    nullable: false,
    update: false,
  })
  usedAt: Date;
}
