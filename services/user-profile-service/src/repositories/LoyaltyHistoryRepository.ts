import { DataSource, Repository } from "typeorm";
import { LoyaltyHistory } from "../models/LoyaltyHistory.entity";

export class LoyaltyHistoryRepository {
  private repository: Repository<LoyaltyHistory>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(LoyaltyHistory);
  }

  // Lấy danh sách LoyaltyHistory theo userId, sắp xếp createdAt DESC, có phân trang
  async findByUserIdOrderByCreatedAtDesc(
    userId: string,
    skip: number,
    take: number
  ): Promise<[LoyaltyHistory[], number]> {
    return this.repository.findAndCount({
      where: { user: { userId } },
      relations: ["user"],
      order: { createdAt: "DESC" },
      skip,
      take,
    });
  }

  // Đếm số LoyaltyHistory theo userId
  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({
      where: { user: { userId } },
    });
  }

  async findById(id: string): Promise<LoyaltyHistory | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(history: LoyaltyHistory): Promise<LoyaltyHistory> {
    return this.repository.save(history);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
