import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { FnbOrderItem } from "./FnbOrderItem.entity";
import { FnbOrderStatus } from "./FnbOrderStatus.entity";

@Entity({ name: "fnb_order" })
export class FnbOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ type: "uuid", nullable: false })
  userId: string;

  @Column({ type: "uuid", nullable: false })
  theaterId: string;

  @Column({ type: "varchar", length: 50, unique: true, nullable: false })
  orderCode: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  totalAmount: string;

  @Column({ type: "enum", enum: FnbOrderStatus, nullable: false })
  status: FnbOrderStatus;

  @Column({ type: "varchar", nullable: true })
  paymentMethod: string;

  @Column({ type: "uuid", nullable: true })
  paymentId?: string;

  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;

  @OneToMany(() => FnbOrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: FnbOrderItem[];
}
