import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { UserProfile } from "./UserProfile.entity";

@Entity({ name: "manager_profiles" })
export class ManagerProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => UserProfile, { eager: false })
  @JoinColumn({
    name: "user_profile_id",
    referencedColumnName: "id",
    foreignKeyConstraintName: "manager_profiles_user_profile_id_fkey",
  })
  userProfile: UserProfile;

  @Column({ name: "managed_cinema_name", nullable: true })
  managedCinemaName: string;

  @Column({ name: "hire_date", type: "date", nullable: true })
  hireDate: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt?: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt?: Date;
}
