import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, type Relation, JoinColumn } from 'typeorm';
import { Theater } from './Theater.js';
import { Room } from './Room.js';
import { ShowtimeSeat } from './ShowtimeSeat.js';
import { ShowtimeStatus } from './enums/ShowtimeStatus.js';

@Entity({ name: 'showtime' })
export class Showtime {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'movie_id', type: 'uuid' })
  movieId: string;

  @ManyToOne(() => Theater, (theater) => theater.showtimes, { eager: true })
  @JoinColumn({ name: 'theater_id' })  // map to existing column
  theater: Relation<Theater>;

  @ManyToOne(() => Room, (room) => room.showtimes, { eager: true })
  @JoinColumn({ name: 'room_id' })
  room: Relation<Room>;

  @Column({ name: 'start_time',type: 'timestamp' })
  startTime: Date;

  @Column({ name:'end_time', type: 'timestamp' })
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
