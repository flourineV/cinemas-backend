import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, type Relation } from 'typeorm';
import { Room } from './Room.js';

@Entity({ name: 'seat' })
export class Seat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({name: 'seat_number'})
  seatNumber: string;

  @Column({ name: 'row_label' })
  rowLabel: string;

  @Column({name: 'column_index'})
  columnIndex: number;

  @Column()
  type: string; // NORMAL, VIP, COUPLE

  @ManyToOne(() => Room, (room) => room.seats, { eager: true })
   @JoinColumn({ name: 'room_id' })  // map to existing column
  room: Relation<Room>;
}
