import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import type{ Relation } from 'typeorm';
import { Booking } from './Booking.js';

@Entity({ name: 'booking_fnb' })
export class BookingFnb {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Booking, (booking) => booking.fnbItems, { onDelete: 'CASCADE' })
  booking!: Relation<Booking>;

  @Column({ type: 'uuid', nullable: false })
  fnbItemId!: string;

  @Column({ type: 'int', nullable: false })
  quantity!: number;

  @Column({ name: 'unit_price', type: 'numeric', precision: 12, scale: 2 })
  unitPrice!: string;

  @Column({ name: 'total_fnb_price', type: 'numeric', precision: 12, scale: 2 })
  totalFnbPrice!: string;
}
