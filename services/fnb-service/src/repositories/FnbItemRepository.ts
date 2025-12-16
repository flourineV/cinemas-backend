import { DataSource, Repository } from "typeorm";
import { FnbItem } from "../models/FnbItem.entity";

export class FnbItemRepository {
  private repo: Repository<FnbItem>;

  constructor(private appDataSource: DataSource) {
    this.repo = this.appDataSource.getRepository(FnbItem);
  }

  async findAllByIdIn(ids: string[]): Promise<FnbItem[]> {
    return this.repo.findBy({ id: ids as any });
  }

  async existsByName(name: string): Promise<boolean> {
    return await this.repo.exist({ where: { name } });
  }

  async save(item: FnbItem): Promise<FnbItem> {
    return this.repo.save(item);
  }

  async findById(id: string): Promise<FnbItem | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<FnbItem[]> {
    return this.repo.find();
  }

  async existsById(id: string): Promise<boolean> {
    return await this.repo.exist({ where: { id } });
  }

  async deleteById(id: string): Promise<void> {
    await this.repo.delete(id);
  }
}
