import "reflect-metadata";
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { FnbOrderItem } from "./FnbOrderItem.entity";
import { FnbOrderStatus } from "./FnbOrderStatus.entity";

@Entity({ name: "fnb_order" })
export class FnbOrder {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid", nullable: false })
  userId: string;

  @Column({
    name: "order_code",
    type: "varchar",
    length: 50,
    unique: true,
    nullable: false,
  })
  orderCode: string;

  @Column({
    name: "total_amount",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
  })
  totalAmount: string;

  @Column({
    name: "status",
    type: "varchar",
    length: 30,
    nullable: false,
    default: FnbOrderStatus.PENDING,
  })
  status: FnbOrderStatus;

  @Column({
    name: "payment_method",
    type: "varchar",
    length: 30,
    nullable: true,
  })
  paymentMethod?: string;

  @Column({ name: "payment_id", type: "uuid", nullable: true })
  paymentId?: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  @OneToMany(() => FnbOrderItem, (item) => item.order, {
    cascade: true,
    eager: false, // LAZY fetch như Java
  })
  items: FnbOrderItem[];
}
