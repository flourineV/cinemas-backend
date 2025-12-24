import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, type Relation } from 'typeorm';
import { Room } from './Room.js';

@Entity({ name: 'seat' })
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  seatNumber: string;

  @Column()
  rowLabel: string;

  @Column()
  columnIndex: number;

  @Column()
  type: string; // NORMAL, VIP, COUPLE

  @ManyToOne(() => Room, (room) => room.seats, { eager: true })
  room: Relation<Room>;
}
