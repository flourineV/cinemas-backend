import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
  } from "typeorm";
  import { UserProfile } from "./UserProfile.entity";
  
  @Entity("user_ranks")
  export class UserRank {
    @PrimaryGeneratedColumn("uuid")
    id: string;
  
    @Column({ type: "varchar", length: 50, unique: true, nullable: false })
    name: string;
  
    @Column({ name: "min_points", type: "int", nullable: false })
    minPoints: number;
  
    @Column({ name: "max_points", type: "int", nullable: true })
    maxPoints: number | null;
  
    @Column({
      name: "discount_rate",
      type: "numeric",
      precision: 5,
      scale: 2,
      default: 0.0,
    })
    discountRate: number;
  
    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;
  
    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
  
    @OneToMany(() => UserProfile, (profile) => profile.rank)
    userProfiles: UserProfile[];
  }
  