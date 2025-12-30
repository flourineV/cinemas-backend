import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, type Relation, JoinColumn } from 'typeorm';
import { Theater } from './Theater.js';
import { Seat } from './Seat.js';
import { Showtime } from './Showtime.js';

@Entity({ name: 'room' })
export class Room {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Theater, (theater) => theater.rooms, { eager: true })
  @JoinColumn({ name: 'theater_id' })
  theater: Relation<Theater>;

  @Column()
  name: string;

  @Column({name: 'seat_count'})
  seatCount: number;

  @OneToMany(() => Seat, seat => seat.room)
  seats: Relation<Seat>[];

  @OneToMany(() => Showtime, (showtime) => showtime.room)
  showtimes: Relation<Showtime>[];
}
