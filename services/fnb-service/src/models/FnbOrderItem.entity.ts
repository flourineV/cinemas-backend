import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { FnbOrder } from "./FnbOrder.entity";

@Entity({ name: "fnb_order_item" })
export class FnbOrderItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @ManyToOne(() => FnbOrder, (order) => order.items, { eager: false })
  @JoinColumn({ name: "order_id" })
  order: FnbOrder;

  @Column({ type: "uuid", nullable: false })
  fnbItemId: string;

  @Column({ type: "int", nullable: false })
  quantity: number;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  unitPrice: string;

  @Column({ type: "decimal", precision: 10, scale: 2, nullable: false })
  totalPrice: string;
}
