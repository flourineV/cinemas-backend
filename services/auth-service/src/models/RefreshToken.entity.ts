import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "./User.entity";

// khai báo table Refresh Token
@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => User, (user) => user.refreshTokens, {
    onDelete: "CASCADE",
  })
  user: User;

  @Column("text")
  token: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
