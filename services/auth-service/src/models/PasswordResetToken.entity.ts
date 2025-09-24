import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User.entity";
import "reflect-metadata";

@Entity("password_reset_tokens")
export class PasswordResetToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  // Quan hệ với bảng users
  @ManyToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user: User;

  @Column({ name: "user_id" })
  userId: string; // lưu raw user_id cho tiện query

  @Column("text")
  token: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @Column({ name: "used_at", type: "timestamp", nullable: true })
  usedAt?: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
