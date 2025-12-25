import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  OneToOne,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { BookingStatus } from './BookingStatus.js';
import { BookingFnb } from './BookingFnb.js';
import { BookingSeat } from './BookingSeat.js';
import { BookingPromotion } from './BookingPromotion.js';
import { v4 as uuidv4 } from 'uuid';

@Entity({ name: 'booking' })
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'booking_code', nullable: false, unique: true })
  bookingCode!: string;

  @Column({ type: 'uuid', nullable: true })
  userId?: string;

  @Column({ type: 'uuid', nullable: false })
  showtimeId!: string;

  @Column({ name: 'movie_id', type: 'uuid', nullable: true })
  movieId?: string;

  @Column({ name: 'movie_title', nullable: true })
  movieTitle?: string;

  @Column({ name: 'movie_title_en', nullable: true })
  movieTitleEn?: string;

  @Column({ name: 'theater_name', nullable: true })
  theaterName?: string;

  @Column({ name: 'theater_name_en', nullable: true })
  theaterNameEn?: string;

  @Column({ name: 'room_name', nullable: true })
  roomName?: string;

  @Column({ name: 'room_name_en', nullable: true })
  roomNameEn?: string;

  @Column({ name: 'show_date_time', type: 'timestamptz', nullable: true })
  showDateTime?: Date;

  @Column({ name: 'payment_id', type: 'uuid', nullable: true })
  paymentId?: string;

  @Column({ type: 'enum', enum: BookingStatus, length: 20, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  totalPrice!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  discountAmount!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  finalPrice!: string;

  @Column({ name: 'payment_method', length: 50, nullable: true })
  paymentMethod?: string;

  @Column({ name: 'guest_name', length: 100, nullable: true })
  guestName?: string;

  @Column({ name: 'guest_email', length: 100, nullable: true })
  guestEmail?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;

  @Column({ name: 'language', length: 5, nullable: true })
  language?: string;

  @OneToMany(() => BookingFnb, (fnb) => fnb.booking, { cascade: true })
  fnbItems!: BookingFnb[];

  @OneToMany(() => BookingSeat, (seat) => seat.booking, { cascade: true })
  seats!: BookingSeat[];

  @OneToOne(() => BookingPromotion, (promo) => promo.booking, { cascade: true })
  promotion?: BookingPromotion;

  @BeforeInsert()
  onCreate() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
    if (!this.status) {
      this.status = BookingStatus.PENDING;
    }
    if (!this.bookingCode || this.bookingCode.trim() === '') {
      this.bookingCode = Booking.generateCode();
    }
  }

  @BeforeUpdate()
  onUpdate() {
    this.updatedAt = new Date();
  }

  static generateCode(): string {
    return uuidv4().replace(/-/g, '').substring(0, 10).toUpperCase();
  }
}
