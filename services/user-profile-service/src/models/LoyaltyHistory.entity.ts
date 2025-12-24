import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from "typeorm";
import { UserProfile } from "./UserProfile.entity";

@Entity({ name: "loyalty_history" })
export class LoyaltyHistory {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => UserProfile, { eager: false })
  @JoinColumn({
    name: "user_id",
    referencedColumnName: "id",
    foreignKeyConstraintName: "fk_loyalty_user",
  })
  user: UserProfile;

  @Column({ name: "booking_id", type: "uuid", nullable: true })
  bookingId: string;

  @Column({ name: "booking_code", nullable: true })
  bookingCode: string;

  @Column({ name: "points_change", type: "int", nullable: false })
  pointsChange: number;

  @Column({ name: "points_before", type: "int", nullable: false })
  pointsBefore: number;

  @Column({ name: "points_after", type: "int", nullable: false })
  pointsAfter: number;

  @Column({
    name: "amount_spent",
    type: "decimal",
    precision: 38,
    scale: 2,
    nullable: true,
  })
  amountSpent: string;

  @Column({ type: "text", nullable: true })
  description: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
