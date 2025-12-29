import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  type Relation,
} from "typeorm";
import { PaymentStatus } from "./PaymentStatus.js";
import { PaymentSeat } from "./PaymentSeat.js";

@Entity("payment_transaction")
export class PaymentTransaction {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: 'booking_id', type: "uuid", nullable: true })
  bookingId?: string;

  @Column({ name: 'fnb_order_id', type: "uuid", nullable: true })
  fnbOrderId?: string;

  @Column({ name: 'user_id', type: "uuid", nullable: false })
  userId!: string;

  @Column({ name: 'showtime_id', type: "uuid", nullable: true })
  showtimeId?: string | null;

  @OneToMany(() => PaymentSeat, (seat) => seat.payment, { cascade: true, eager: true })
  seats: Relation<PaymentSeat>[];

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

  @Column({ name: "transaction_ref", type: "varchar", length: 255, unique: true, nullable: false })
  transactionRef!: string;

  @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamp with time zone" })
  updatedAt!: Date;
}
