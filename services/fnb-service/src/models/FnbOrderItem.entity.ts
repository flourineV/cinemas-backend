import "reflect-metadata";
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

  @ManyToOne(() => FnbOrder, (order) => order.items, {
    onDelete: "CASCADE",
    // Note: TypeORM TypeScript doesn't support lazy loading like Java JPA
    // Use relations option when querying to control loading
  })
  @JoinColumn({ name: "order_id" })
  order: FnbOrder;

  @Column({ name: "fnb_item_id", type: "uuid", nullable: false })
  fnbItemId: string;

  @Column({ type: "int", nullable: false })
  // Note: CHECK constraint (quantity > 0) is defined in database schema
  quantity: number;

  @Column({
    name: "unit_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
  })
  unitPrice: string;

  @Column({
    name: "total_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
    select: true,
    insert: false, // Don't insert - it's a generated column
    update: false, // Don't update - it's a generated column
    // Note: This column is GENERATED ALWAYS AS (quantity * unit_price) STORED in database
    // TypeORM will read the value but won't try to insert/update it
  })
  totalPrice: string;
}
