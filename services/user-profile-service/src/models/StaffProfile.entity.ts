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

@Entity({ name: "staff_profiles" })
export class StaffProfile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @OneToOne(() => UserProfile, { eager: false })
  @JoinColumn({
    name: "user_profile_id",
    referencedColumnName: "id",
    foreignKeyConstraintName: "staff_profiles_user_profile_id_fkey",
  })
  userProfile: UserProfile;

  @Column({ name: "cinema_name", nullable: false })
  cinemaName: string;

  @Column({ name: "hire_date", type: "date", nullable: false })
  hireDate: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
