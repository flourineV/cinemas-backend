import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { Role } from "./Role.entity";
import { RefreshToken } from "./RefreshToken.entity";

// khai báo table Users
@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true, length: 100 })
  email: string;

  @Column({ unique: true, length: 30 })
  username: string;

  @Column({ name: "phone_number", unique: true, length: 15 })
  phoneNumber: string;

  @Column({ name: "national_id", unique: true, length: 20, nullable: true })
  nationalId: string;

  @Column({ name: "password_hash", length: 255 })
  passwordHash: string;

  @Column({ default: "ACTIVE" }) // ACTIVE | BANNED
  status: string;

  @ManyToOne(() => Role, (role) => role.users, { eager: true })
  role: Role;

  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens: RefreshToken[];

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;
}
