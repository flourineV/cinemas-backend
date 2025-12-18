import { DataSource, Repository } from "typeorm";
import { Promotion } from "../models/Promotion.entity";

export class PromotionRepository {
  private repo: Repository<Promotion>;

  constructor(dataSource: DataSource) {
    this.repo = dataSource.getRepository(Promotion);
  }

  async findValidPromotionByCode(
    code: string,
    now: Date
  ): Promise<Promotion | null> {
    return await this.repo
      .createQueryBuilder("p")
      .where("p.code = :code", { code })
      .andWhere("p.startDate <= :now", { now })
      .andWhere("p.endDate >= :now", { now })
      .andWhere("p.isActive = true")
      .getOne();
  }

  async findByCode(code: string): Promise<Promotion | null> {
    return await this.repo.findOne({ where: { code } });
  }

  async findAll(): Promise<Promotion[]> {
    return await this.repo.find();
  }

  async save(entity: Promotion): Promise<Promotion> {
    return await this.repo.save(entity);
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }

  async findById(id: string) {
    return await this.repo.findOne({ where: { id } });
  }

  async existsById(id: string): Promise<boolean> {
    const count = await this.repo.count({ where: { id } });
    return count > 0;
  }
}
