import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import "reflect-metadata";

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid", unique: true })
  userId: string;

  @Column({ name: "email", length: 100, unique: true })
  email: string;

  @Column({ name: "username", length: 50, unique: true, nullable: true })
  username: string;

  @Column({ name: "full_name", length: 100, nullable: true })
  fullName: string;

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl: string;

  @Column({ name: "gender", length: 10, nullable: true })
  gender: string;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth: Date;

  @Column({ name: "favorite_genres", type: "text", array: true, nullable: true })
  favoriteGenres: string[];

  @Column({ name: "phone_number", length: 20, nullable: true })
  phoneNumber: string;

  @Column({ name: "national_id", length: 20, nullable: true })
  nationalId: string;

  @Column({ name: "address", type: "text", nullable: true })
  address: string;

  @Column({ name: "loyalty_point", type: "int", default: 0 })
  loyaltyPoint: number;

  @Column({ name: "rank", length: 20, nullable: true })
  rank: string;

  @Column({ name: "status", length: 20, default: "ACTIVE" })
  status: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
