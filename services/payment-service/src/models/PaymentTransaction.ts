import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { PaymentStatus } from "./PaymentStatus.js";

@Entity("payment_transaction")
export class PaymentTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "uuid", nullable: true })
  bookingId?: string;

  @Column({ type: "uuid", nullable: true })
  fnbOrderId?: string;

  @Column({ type: "uuid", nullable: false })
  userId!: string;

  @Column({ type: "uuid", nullable: true })
  showtimeId?: string | null;

  @Column("uuid", { array: true, nullable: true })
  seatIds?: string[];

  @Column("decimal", { precision: 10, scale: 2, nullable: false })
  amount!: string; // store as string to avoid floating point issues

  @Column({ type: "varchar", length: 50, nullable: false })
  method!: string;

  @Column({
    type: "enum",
    enum: PaymentStatus,
    nullable: false,
  })
  status!: PaymentStatus;

  @Column({ type: "varchar", length: 255, unique: true, nullable: false })
  transactionRef!: string;

  @CreateDateColumn({ type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamp with time zone" })
  updatedAt!: Date;
}
