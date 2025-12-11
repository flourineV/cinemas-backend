import { User } from "../../models/User.entity";
import { Role } from "../../models/Role.entity";

export class UserListResponse {
  id: string;
  username: string;
  email: string;
  phoneNumber: string;
  role: string | null;
  status: string;
  createdAt: Date;

  constructor(
    id: string,
    username: string,
    email: string,
    phoneNumber: string,
    role: string | null,
    status: string,
    createdAt: Date
  ) {
    this.id = id;
    this.username = username;
    this.email = email;
    this.phoneNumber = phoneNumber;
    this.role = role;
    this.status = status;
    this.createdAt = createdAt;
  }

  static fromEntity(user: User): UserListResponse {
    return new UserListResponse(
      user.id,
      user.username,
      user.email,
      user.phoneNumber,
      user.role ? (user.role as Role).name : null,
      user.status,
      user.createdAt
    );
  }
}
