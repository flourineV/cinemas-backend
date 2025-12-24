import { Entity, PrimaryGeneratedColumn, Column, OneToMany, type Relation } from 'typeorm';
import { Theater } from './Theater.js';

@Entity({ name: 'province' })
export class Province {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @OneToMany(() => Theater, (theater) => theater.province)
  theaters: Relation<Theater>[];
}
