import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from "typeorm";
import { NotificationType } from "./NotificationType.js";

@Entity({ name: "notification" })
@Index("idx_notification_user_id", ["userId"])
@Index("idx_notification_type", ["type"])
@Index("idx_notification_created_at", ["createdAt"])
export class Notification {
    @PrimaryGeneratedColumn("uuid")
    id!: string;

    @Column({ name:'user_id',type: "uuid", nullable: false })
    userId!: string;

    @Column({ type: "varchar", length: 255, nullable: false })
    title!: string;

    @Column({ type: "text", nullable: false })
    message!: string;

    @Column({ name: 'booking_id', type: "uuid", nullable: true })
    bookingId?: string;

    @Column({ name: 'payment_id', type: "uuid", nullable: true })
    paymentId?: string;

    @Column({ type: "decimal", nullable: true })
    amount?: number;

    @Column({
        type: "enum",
        enum: NotificationType,
        nullable: false,
    })
    type!: NotificationType;

    @Column({ type: "jsonb", nullable: true })
    metadata?: Record<string, any>;

    @CreateDateColumn({ name: "created_at", type: "timestamp with time zone" })
    createdAt!: Date;
}
