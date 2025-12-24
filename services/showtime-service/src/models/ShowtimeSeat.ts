import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, type Relation } from 'typeorm';
import { Showtime } from './Showtime.js';
import { Seat } from './Seat.js';
import { SeatStatus } from './enums/SeatStatus.js';

@Entity({ name: 'showtime_seat' })
export class ShowtimeSeat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Showtime, (showtime) => showtime.showtimeSeats, { eager: true })
  showtime: Relation<Showtime>;

  @ManyToOne(() => Seat, { eager: true })
  seat: Seat;

  @Column({
    type: 'enum',
    enum: SeatStatus,
    default: SeatStatus.AVAILABLE,
  })
  status: SeatStatus;

  @Column({ type: 'timestamp', nullable: true })
  updatedAt: Date;
}
