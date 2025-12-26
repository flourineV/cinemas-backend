import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, type Relation } from 'typeorm';
import { Theater } from './Theater.js';
import { Seat } from './Seat.js';
import { Showtime } from './Showtime.js';

@Entity({ name: 'room' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Theater, (theater) => theater.rooms, { eager: true })
  theater: Relation<Theater>;

  @Column()
  name: string;

  @Column()
  seatCount: number;

  @OneToMany(() => Seat, seat => seat.room)
  seats: Relation<Seat>[];

  @OneToMany(() => Showtime, (showtime) => showtime.room)
  showtimes: Relation<Showtime>[];
}
