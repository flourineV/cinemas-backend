import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { Theater } from './Theater.js';
import { Room } from './Room.js';
import { ShowtimeSeat } from './ShowtimeSeat.js';
import { ShowtimeStatus } from './enums/ShowtimeStatus.js';

@Entity({ name: 'showtime' })
export class Showtime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  movieId: string;

  @ManyToOne(() => Theater, (theater) => theater.showtimes, { eager: true })
  theater: Relation<Theater>;

  @ManyToOne(() => Room, (room) => room.showtimes, { eager: true })
  room: Relation<Room>;

  @Column({ type: 'timestamp' })
  startTime: Date;

  @Column({ type: 'timestamp' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: ShowtimeStatus,
    default: ShowtimeStatus.ACTIVE,
  })
  status: ShowtimeStatus;

  @OneToMany(() => ShowtimeSeat, (showtimeSeat) => showtimeSeat.showtime)
  showtimeSeats: Relation<ShowtimeSeat>[];
}
