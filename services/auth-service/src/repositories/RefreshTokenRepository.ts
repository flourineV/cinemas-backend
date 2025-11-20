import { DataSource, Repository } from "typeorm";
import { RefreshToken } from "../models/RefreshToken.entity";
import { User } from "../models/User.entity";

// khai báo repository refresh token
export class RefreshTokenRepository {
  private repository: Repository<RefreshToken>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(RefreshToken);
  }

  // tạo token
  create(refreshToken: Partial<RefreshToken>): RefreshToken {
    return this.repository.create(refreshToken);
  }

  // lưu token
  async save(refreshToken: RefreshToken): Promise<RefreshToken> {
    return await this.repository.save(refreshToken);
  }

  // xóa token
  async delete(refreshToken: RefreshToken) {
    await this.repository.delete(refreshToken);
  }

  // tìm token bằng token
  async findByToken(token: string): Promise<RefreshToken | null> {
    return await this.repository.findOne({ where: { token } });
  }

  // tìm token bằng user
  async findByUser(user: User): Promise<RefreshToken | null> {
    return await this.repository.findOne({ where: { user } });
  }

  // xóa token bởi user
  async deleteByUser(user: User): Promise<void> {
    await this.repository.delete({ user });
  }

  // xóa token bởi token
  async deleteByToken(token: string): Promise<void> {
    await this.repository.delete({ token });
  }

  // xóa token hết hạn
  async deleteExpiredTokens(now: Date): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .delete()
      .from(RefreshToken)
      .where("expires_at < :now", { now })
      .execute();
  }
}
