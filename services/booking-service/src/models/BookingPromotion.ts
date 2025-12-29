import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import type {Relation} from "typeorm";
import { Booking } from './Booking.js';
import { DiscountType } from './DiscountType.js';

@Entity({ name: 'booking_promotion' })
export class BookingPromotion {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Booking, (booking) => booking.promotion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' })
  booking!: Relation<Booking>;

  @Column({ name: 'promotion_code', length: 50 })
  promotionCode!: string;

  @Column({ name: 'discount_type', type: 'enum', enum: DiscountType })
  discountType!: DiscountType;

  @Column({ name: 'discount_value', type: 'numeric', precision: 10, scale: 2 })
  discountValue!: string;
}
