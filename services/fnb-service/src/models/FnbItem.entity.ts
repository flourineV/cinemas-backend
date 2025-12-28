import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity({ name: "fnb_item" })
export class FnbItem {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "name",
    type: "varchar",
    length: 255,
    unique: true,
    nullable: false,
  })
  name: string;

  @Column({
    name: "name_en",
    type: "varchar",
    length: 255,
    unique: true,
    nullable: true,
  })
  nameEn?: string;

  @Column({ name: "description", type: "text", nullable: true })
  description: string;

  @Column({ name: "description_en", type: "text", nullable: true })
  descriptionEn?: string;

  @Column({
    name: "unit_price",
    type: "decimal",
    precision: 10,
    scale: 2,
    nullable: false,
  })
  unitPrice: string;

  @Column({ name: "image_url", type: "varchar", length: 500, nullable: true })
  imageUrl: string;
}
