import { DataSource, Repository } from "typeorm";
import { RefreshToken } from "../models/RefeshToken.entity";

export class RefreshTokenRepository {
  private repository: Repository<RefreshToken>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(RefreshToken);
  }

  async create(data: {
    userId: string;
    token: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    const refreshToken = this.repository.create({
      userId: data.userId,
      token: data.token,
      expiresAt: data.expiresAt,
    });

    return await this.repository.save(refreshToken);
  }

  async findOneByToken(token: string): Promise<RefreshToken | null> {
    return await this.repository.findOne({ where: { token } });
  }
}
