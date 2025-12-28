import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "seat_price" })
export class SeatPrice {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "seat_type", length: 50 })
  seatType: string;

  @Column({ name: "ticket_type", length: 50 })
  ticketType: string;

  @Column("decimal", { name: "base_price", precision: 10, scale: 2 })
  basePrice: number;

  @Column({ name: "description", length: 255, nullable: true })
  description: string;

  @Column({ name: "description_en", length: 255, nullable: true })
  descriptionEn: string;
}
