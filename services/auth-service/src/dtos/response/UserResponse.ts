import { User } from "../../models/User.entity";
import { Role } from "../../models/Role.entity";

export class UserResponse {
  id: string;
  username: string;
  role: string | null;
  status: string;

  constructor(
    id: string,
    username: string,
    role: string | null,
    status: string
  ) {
    this.id = id;
    this.username = username;
    this.role = role;
    this.status = status;
  }

  static fromEntity(user: User): UserResponse {
    return new UserResponse(
      user.id,
      user.username,
      user.role ? (user.role as Role).name : null,
      user.status
    );
  }
}
