import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";
import "reflect-metadata";

export enum UserRole {
  USER = "USER",
  STAFF = "STAFF",
  ADMIN = "ADMIN",
}
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100, unique: true })
  email: string;

  @Column({ length: 50, unique: true })
  username: string;

  @Column({ name: "phone_number", length: 15, unique: true })
  phoneNumber: string;

  @Column({ name: "national_id", length: 20, nullable: true, unique: true })
  nationalId: string;

  @Column({ name: "password_hash" })
  passwordHash: string;

  @Column({
    type: "enum",
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
