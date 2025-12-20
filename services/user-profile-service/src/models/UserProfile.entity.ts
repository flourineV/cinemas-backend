import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserRank } from "./UserRank.entity";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

@Entity({ name: "user_profiles" })
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", unique: true, nullable: false, type: "uuid" })
  userId: string;

  @Column({ unique: true, nullable: false, length: 100 })
  email: string;

  @Column({ unique: true, length: 30, nullable: true })
  username: string;

  @Column({ name: "full_name", length: 100, nullable: true })
  fullName: string;

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl: string;

  @Column({ type: "enum", enum: Gender, nullable: true })
  gender: Gender;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth: Date;

  @Column({ name: "phone_number", length: 20, nullable: true })
  phoneNumber: string;

  @Column({ name: "national_id", length: 20, nullable: true })
  nationalId: string;

  @Column({ type: "text", nullable: true })
  address: string;

  @Column({ name: "loyalty_point", type: "int", default: 0, nullable: false })
  loyaltyPoint: number;

  @ManyToOne(() => UserRank, { eager: false })
  @JoinColumn({
    name: "rank_id",
    foreignKeyConstraintName: "user_profiles_rank_id_fkey",
  })
  rank: UserRank;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    nullable: false,
  })
  status: UserStatus;

  @Column({
    name: "receive_promo_email",
    type: "boolean",
    default: false,
    nullable: false,
  })
  receivePromoEmail: boolean;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
