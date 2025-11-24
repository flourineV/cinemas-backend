import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from "typeorm";
import { UserRank } from "./UserRank.entity";
import { UserFavoriteMovie } from "./UserFavoriteMovie.entity";
import { StaffProfile } from "./StaffProfile.entity";
import { ManagerProfile } from "./ManagerProfile.entity";

export enum UserStatus {
  ACTIVE = "ACTIVE",
  BANNED = "BANNED",
}

export enum Gender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

@Entity("user_profiles")
export class UserProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid", unique: true, nullable: false })
  userId: string;

  @Column({ type: "varchar", length: 100, unique: true, nullable: false })
  email: string;

  @Column({ type: "varchar", length: 30, unique: true, nullable: true })
  username: string | null;

  @Column({ name: "full_name", type: "varchar", length: 100, nullable: true })
  fullName: string | null;

  @Column({ name: "avatar_url", type: "text", nullable: true })
  avatarUrl: string | null;

  @Column({ type: "enum", enum: Gender, nullable: true })
  gender: Gender | null;

  @Column({ name: "date_of_birth", type: "date", nullable: true })
  dateOfBirth: Date | null;

  @Column({ name: "phone_number", type: "varchar", length: 20, nullable: true })
  phoneNumber: string | null;

  @Column({ name: "national_id", type: "varchar", length: 20, nullable: true })
  nationalId: string | null;

  @Column({ type: "text", nullable: true })
  address: string | null;

  @Column({ name: "loyalty_point", type: "int", default: 0 })
  loyaltyPoint: number;

  @ManyToOne(() => UserRank, (rank) => rank.userProfiles, {
    onDelete: "SET NULL",
    nullable: true,
  })
  rank: UserRank | null;

  @Column({
    type: "enum",
    enum: UserStatus,
    default: UserStatus.ACTIVE,
    nullable: false,
  })
  status: UserStatus;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Quan hệ ngược
  @OneToMany(() => UserFavoriteMovie, (fav) => fav.user)
  favoriteMovies: UserFavoriteMovie[];

  @OneToOne(() => StaffProfile, (staff) => staff.userProfile)
  staffProfile: StaffProfile;

  @OneToOne(() => ManagerProfile, (manager) => manager.userProfile)
  managerProfile: ManagerProfile;
}
