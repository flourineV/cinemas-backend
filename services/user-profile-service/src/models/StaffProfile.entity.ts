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
  
  @Entity("staff_profiles")
  export class StaffProfile {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @OneToOne(() => UserProfile, (userProfile) => userProfile.staffProfile, {
      onDelete: "CASCADE",
    })
    @JoinColumn({
      name: "user_profile_id",
      foreignKeyConstraintName: "fk_staff_user",
    })
    userProfile: UserProfile;
  
    @Column({ name: "cinema_id", type: "uuid", nullable: true })
    cinemaId: string | null;
  
    @Column({ name: "start_date", type: "date", nullable: false })
    startDate: Date;
  
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
  
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
  }
  