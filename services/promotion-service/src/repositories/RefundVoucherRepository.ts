import { DataSource, Repository, Between } from "typeorm";
import { RefundVoucher } from "../models/RefundVoucher.entity";

export class RefundVoucherRepository {
  private repo: Repository<RefundVoucher>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(RefundVoucher);
  }

  async save(entity: RefundVoucher): Promise<RefundVoucher> {
    return await this.repo.save(entity);
  }

  async findAll(): Promise<RefundVoucher[]> {
    return await this.repo.find();
  }

  async findByCode(code: string): Promise<RefundVoucher | null> {
    return await this.repo.findOne({ where: { code } });
  }

  async findByUserIdAndIsUsedFalse(
    userId: string
  ): Promise<RefundVoucher | null> {
    return await this.repo.findOne({ where: { userId, isUsed: false } });
  }

  async existsByCode(code: string): Promise<boolean> {
    const count = await this.repo.count({ where: { code } });
    return count > 0;
  }

  async countByUserIdAndCreatedAtBetween(
    userId: string,
    start: Date,
    end: Date
  ): Promise<number> {
    return await this.repo.count({
      where: {
        userId,
        createdAt: Between(start, end),
      },
    });
  }
}
