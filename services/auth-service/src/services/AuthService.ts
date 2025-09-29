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
    phoneNumber: string;
    nationalId: string;
    password: string;
    confirmPassword: string;
  }): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: {
      id: string;
      username: string;
      role: string;
    };
  }> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    //Validate Email
    if (!emailRegex.test(data.email)) {
      throw new ServiceError(ServiceErrorType.INVALID_EMAIL);
    }
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
    if (data.password !== data.confirmPassword) {
        throw new ServiceError(ServiceErrorType.PASSWORD_MISMATCH); // Cần định nghĩa ServiceErrorType.PASSWORD_MISMATCH
    }
    if (data.password.length < 8) {
        throw new ServiceError(ServiceErrorType.WEAK_PASSWORD); // Cần định nghĩa ServiceErrorType.WEAK_PASSWORD
    }
    if (await this.userRepository.findByNationalId(data.nationalId)){
      throw new ServiceError(ServiceErrorType.NATIONAL_ID_EXISTS);
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

    // Generate tokens same as login
    const tokens = await this.generateTokens(user);
    // Trong AuthService.ts
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  async login(data: { usernameOrEmailOrPhone: string; password: string } | User): Promise<{
    accessToken: string;
    refreshToken: string;
    tokenType: string;
    user: {
      id: string;
      username: string;
      role: string;
    };
  }> {
    let user: User;

    if (data instanceof User) {
      // Log in again from refresh token
      user = data;
    } else {
      // Log in with email + password
      const foundUser = await this.userRepository.findByEmail(data.usernameOrEmailOrPhone);
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

      user = foundUser;
    }

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      tokenType: "Bearer",
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
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

    // Store refresh token in DB
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

      // Call login again
      return this.login(user);
    } catch (e) {
      throw new ServiceError(ServiceErrorType.INVALID_REFRESH_TOKEN, 403);
    }
  }
}
