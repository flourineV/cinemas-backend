import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { User } from "./User.entity";
// khai báo table Roles
@Entity("roles")
export class Role {
  @PrimaryGeneratedColumn("increment")
  id: number;

  @Column({ unique: true, length: 30 })
  name: string;

  @Column({ length: 255, nullable: true })
  description: string;

  @OneToMany(() => User, (user) => user.role)
  users: User[];
}
