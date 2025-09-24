import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { UserRepository } from "../repositories/UserRepository";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { User, UserRole } from "../models/User.entity";
import { jwtConfig } from "../config/jwt.config";
import {
  ServiceError,
  ServiceErrorType,
} from "../middlewares/serviceErrorHandler";

export class AuthService {
  private userRepository: UserRepository;
  private refreshTokenRepository: RefreshTokenRepository;

  constructor() {
    this.userRepository = new UserRepository(AppDataSource);
    this.refreshTokenRepository = new RefreshTokenRepository(AppDataSource);
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
      role: UserRole.USER, // Default is USER
    });

    return user;
  }

  async login(data: { email: string; password: string } | User): Promise<{
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
  }> {
    let user: User;

    if (data instanceof User) {
      // Trường hợp login lại từ refresh token
      user = data;
    } else {
      // Trường hợp login bằng email + password
      const foundUser = await this.userRepository.findByEmail(data.email);
      if (!foundUser) {
        throw new ServiceError(ServiceErrorType.USER_NOT_FOUND, 404);
      }

      const isPasswordValid = await bcrypt.compare(
        data.password,
        foundUser.passwordHash
      );
      if (!isPasswordValid) {
        throw new ServiceError(ServiceErrorType.INVALID_PASSWORD, 401);
      }

      user = foundUser; // gán vào đây sau khi chắc chắn không null
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return { user, tokens };
  }

  async generateTokens(user: User): Promise<{
    accessToken: string;
    refreshToken: string;
  }> {
    const accessToken = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      jwtConfig.accessToken.secret,
      jwtConfig.accessToken.signOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      jwtConfig.refreshToken.secret,
      jwtConfig.refreshToken.signOptions
    );

    // Lưu refresh token vào DB
    await this.refreshTokenRepository.create({
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60), // 1h
    });

    return { accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = jwt.verify(
        refreshToken,
        jwtConfig.refreshToken.secret
      ) as jwt.JwtPayload;

      const stored =
        await this.refreshTokenRepository.findOneByToken(refreshToken);
      if (!stored || stored.expiresAt < new Date()) {
        throw new ServiceError(ServiceErrorType.INVALID_REFRESH_TOKEN, 403);
      }

      const user = await this.userRepository.findById(stored.userId);
      if (!user) {
        throw new ServiceError(ServiceErrorType.USER_NOT_FOUND, 404);
      }

      // Chỉ gọi login thôi
      return this.login(user);
    } catch (e) {
      throw new ServiceError(ServiceErrorType.INVALID_REFRESH_TOKEN, 403);
    }
  }
}
