import { RefreshToken } from "../models/RefreshToken.entity";
import { RefreshTokenRepository } from "../repositories/RefreshTokenRepository";
import { User } from "../models/User.entity";
import { v4 as uuid } from "uuid";
import createHttpError from "http-errors";

export class RefreshTokenService {
  private refreshTokenRepository: RefreshTokenRepository;
  private refreshTokenDurationDays: number;

  constructor(refreshTokenRepository: RefreshTokenRepository) {
    this.refreshTokenRepository = refreshTokenRepository;
    this.refreshTokenDurationDays = Number(
      process.env.REFRESH_TOKEN_DURATION_DAYS
    );
  }

  // tạo refresh token
  async createRefreshToken(user: User): Promise<RefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      user,
      token: uuid(),
      expiresAt: new Date(
        Date.now() + this.refreshTokenDurationDays * 24 * 60 * 60 * 1000
      ),
    });

    return await this.refreshTokenRepository.save(refreshToken);
  }

  // tìm token bằng token
  async findByToken(token: string): Promise<RefreshToken | null> {
    return this.refreshTokenRepository.findByToken(token);
  }

  // chech hạn của token
  async verifyExpiration(token: RefreshToken): Promise<RefreshToken> {
    if (token.expiresAt.getTime() < Date.now()) {
      await this.refreshTokenRepository.delete(token);
      throw new createHttpError.Unauthorized(
        "Refresh token was expired. Please sign in again."
      );
    }
    return token;
  }

  // xóa token
  async deleteByToken(token: string): Promise<void> {
    await this.refreshTokenRepository.deleteByToken(token);
  }

  // xóa token by user
  async deleteByUser(user: User): Promise<void> {
    await this.refreshTokenRepository.deleteByUser(user);
  }

  // xóa token hết hạn
  async deleteExpiredTokens(): Promise<void> {
    await this.refreshTokenRepository.deleteExpiredTokens(new Date());
  }
}
