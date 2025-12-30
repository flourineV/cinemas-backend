import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, type Relation } from 'typeorm';
import { Showtime } from './Showtime.js';
import { Seat } from './Seat.js';
import { SeatStatus } from './enums/SeatStatus.js';

@Entity({ name: 'showtime_seat' })
export class ShowtimeSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Showtime, (showtime) => showtime.showtimeSeats, { eager: true })
   @JoinColumn({ name: 'showtime_id' })  // map to existing column
  showtime: Relation<Showtime>;

  @ManyToOne(() => Seat, { eager: true })
   @JoinColumn({ name: 'seat_id' })  // map to existing column
  seat: Seat;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column({ name: 'updated_at', type: 'timestamp', nullable: true })
  updatedAt: Date;
}
