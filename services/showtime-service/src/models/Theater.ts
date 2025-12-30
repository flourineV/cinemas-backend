import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn, type Relation } from 'typeorm';
import { Province } from './Province.js';
import { Room } from './Room.js';
import { Showtime } from './Showtime.js';

@Entity({ name: 'theater' })
export class Theater {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Province, (province) => province.theaters, { eager: true })
  @JoinColumn({ name: 'province_id' })  // <- map to actual DB column
  province: Relation<Province>;

  @Column()
  name: string;

  @Column()
  address: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'theater_image_url', length: 500, nullable: true })
  theaterImageUrl: string;

  @OneToMany(() => Room, (room) => room.theater)
  rooms: Relation<Room>[];

  @OneToMany(() => Showtime, (showtime) => showtime.theater)
  showtimes: Relation<Showtime>[];
}
