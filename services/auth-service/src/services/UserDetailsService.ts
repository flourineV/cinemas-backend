// src/services/UserDetailsService.ts
import { UserRepository } from "../repositories/UserRepository";
import { UserPrincipal } from "../interfaces/UserPrincipal";
import { User } from "../models/User.entity";

export class UserDetailsService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  // load user bằng username
  async loadUserByUsername(identifier: string): Promise<UserPrincipal> {
    const user: User | null =
      await this.userRepository.findByEmailOrUsernameOrPhoneNumber(identifier);

    if (!user) {
      throw new Error(`User Not Found with identifier: ${identifier}`);
    }

    return this.createUserPrincipal(user);
  }

  // load user bằng id
  async loadUserById(userId: string): Promise<UserPrincipal> {
    const user: User | null = await this.userRepository.findById(userId);

    if (!user) {
      throw new Error(`User Not Found with id: ${userId}`);
    }

    return this.createUserPrincipal(user);
  }

  // tạo thông tin đăng nhập
  private createUserPrincipal(user: User): UserPrincipal {
    const roleName = user.role ? user.role.name : "guest";

    return {
      id: user.id,
      email: user.email,
      password: user.passwordHash,
      role: roleName.toLowerCase(),
    };
  }
}
