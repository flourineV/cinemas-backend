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
  
  @Entity("manager_profiles")
  export class ManagerProfile {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @OneToOne(() => UserProfile, (userProfile) => userProfile.managerProfile, {
      onDelete: "CASCADE",
    })
    @JoinColumn({
      name: "user_profile_id",
      foreignKeyConstraintName: "fk_manager_user",
    })
    userProfile: UserProfile;
  
    @Column({ name: "managed_cinema_id", type: "uuid", nullable: true })
    managedCinemaId: string | null;
  
    @Column({ name: "hire_date", type: "date", nullable: true })
    hireDate: Date | null;
  
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
  
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
  }
  