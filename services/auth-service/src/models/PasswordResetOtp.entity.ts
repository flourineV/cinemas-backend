import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from "typeorm";

// khai báo table Password Reset Otp
@Entity("password_reset_otps")
export class PasswordResetOtp {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ length: 100 })
  email: string;

  @Column({ length: 10 })
  otp: string;

  @Column({ name: "expires_at", type: "timestamp" })
  expiresAt: Date;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;
}
