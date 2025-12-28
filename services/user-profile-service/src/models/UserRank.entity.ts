import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";

@Entity({ name: "user_ranks" })
export class UserRank {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "name", unique: true, nullable: false, length: 50 })
  name: string;

  @Column({ name: "name_en", nullable: true, length: 50 })
  nameEn: string;

  @Column({ name: "min_points", nullable: false })
  minPoints: number;

  @Column({ name: "max_points", nullable: true })
  maxPoints: number;

  @Column({
    name: "discount_rate",
    type: "decimal",
    precision: 5,
    scale: 2,
    default: 0.0,
  })
  discountRate: number;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
