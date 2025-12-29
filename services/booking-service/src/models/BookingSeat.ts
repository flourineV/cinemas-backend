import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, JoinColumn } from 'typeorm';
import type {Relation} from "typeorm";
import { Booking } from './Booking.js';

@Entity({ name: 'booking_seat' })
export class BookingSeat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name:'seat_id',type: 'uuid', nullable: false })
  seatId!: string;

  @Column({ name: 'seat_number', length: 10, nullable: true })
  seatNumber?: string;

  @Column({ name: 'seat_type', length: 50 })
  seatType!: string;

  @Column({ name: 'ticket_type', length: 50 })
  ticketType!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  price!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @ManyToOne(() => Booking, (booking) => booking.seats, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'booking_id' }) // 👈 explicit FK column name
  booking!: Relation<Booking>;
}
