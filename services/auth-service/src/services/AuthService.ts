import bcrypt from "bcrypt";
import { AppDataSource } from "../config/database";
import { UserRepository } from "../repositories/UserRepository";
import { User, UserRole } from "../models/User.entity";
import {
  ServiceError,
  ServiceErrorType,
} from "../middlewares/serviceErrorHandler";

export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository(AppDataSource);
  }

  async register(data: {
    email: string;
    username: string;
    password: string;
    phoneNumber: string;
    nationalId?: string;
  }): Promise<User> {
    // Check unique fields
    if (await this.userRepository.findByEmail(data.email)) {
      throw new ServiceError(ServiceErrorType.EMAIL_EXISTS);
    }
    if (await this.userRepository.findByUsername(data.username)) {
      throw new ServiceError(ServiceErrorType.USERNAME_EXISTS);
    }
    if (await this.userRepository.findByPhoneNumber(data.phoneNumber)) {
      throw new ServiceError(ServiceErrorType.PHONE_EXISTS);
    }

    // Create new user
    const user = await this.userRepository.create({
      email: data.email,
      username: data.username,
      passwordHash: await bcrypt.hash(data.password, 10),
      phoneNumber: data.phoneNumber,
      nationalId: data.nationalId,
      role: UserRole.USER, // Mặc định là USER
    });

    return user;
  }
}

//   async login(data: { email: string; password: string }) {
// //     const user = await UserRepository.findByEmail(data.email);
// //     if (!user) throw new Error("User not found");

// //     const valid = await bcrypt.compare(data.password, user.password);
// //     if (!valid) throw new Error("Invalid credentials");

// //     const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET!, { expiresIn: "1h" });
// //     return { user, token };
// //   }
// }
