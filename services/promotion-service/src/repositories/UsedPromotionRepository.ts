import { DataSource, Repository } from "typeorm";
import { UsedPromotion } from "../models/UsedPromotion.entity";

export class UsedPromotionRepository {
  private repo: Repository<UsedPromotion>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(UsedPromotion);
  }

  async findByUserIdAndPromotionCode(
    userId: string,
    promotionCode: string
  ): Promise<UsedPromotion | null> {
    return await this.repo.findOne({ where: { userId, promotionCode } });
  }

  async existsByUserIdAndPromotionCode(
    userId: string,
    promotionCode: string
  ): Promise<boolean> {
    const count = await this.repo.count({ where: { userId, promotionCode } });
    return count > 0;
  }

  async findByBookingId(bookingId: string): Promise<UsedPromotion | null> {
    return await this.repo.findOne({ where: { bookingId } });
  }

  async delete(entity: UsedPromotion): Promise<void> {
    await this.repo.remove(entity);
  }

  async save(entity: UsedPromotion): Promise<UsedPromotion> {
    return await this.repo.save(entity);
  }
}
