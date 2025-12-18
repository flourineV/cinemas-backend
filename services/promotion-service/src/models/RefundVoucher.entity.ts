import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import { v4 as uuidv4 } from "uuid";

@Entity({ name: "refund_voucher" })
@Index("idx_refund_voucher_user_id", ["userId"])
@Index("idx_refund_voucher_code", ["code"], { unique: true })
export class RefundVoucher {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "varchar", length: 20, unique: true, nullable: false })
  code: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  value: string;

  @Column({ type: "boolean", nullable: false, default: false })
  isUsed: boolean;

  @CreateDateColumn({ type: "timestamp", name: "created_at" })
  createdAt: Date;

  @Column({ type: "timestamp", name: "expired_at", nullable: true })
  expiredAt: Date;

  static generateCode(): string {
    return "REF-" + uuidv4().substring(0, 8).toUpperCase();
  }
}
