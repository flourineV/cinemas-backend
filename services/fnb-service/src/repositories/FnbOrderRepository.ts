import { DataSource, Repository } from "typeorm";
import { FnbOrder } from "../models/FnbOrder.entity";
import { FnbOrderStatus } from "../models/FnbOrderStatus.entity";

export class FnbOrderRepository {
  private repo: Repository<FnbOrder>;

  constructor(private appDataSource: DataSource) {
    this.repo = this.appDataSource.getRepository(FnbOrder);
  }

  async findByUserId(userId: string): Promise<FnbOrder[]> {
    return this.repo.find({ where: { userId } });
  }

  async findByUserIdAndStatus(
    userId: string,
    status: FnbOrderStatus
  ): Promise<FnbOrder[]> {
    return this.repo.find({ where: { userId, status } });
  }

  async save(order: FnbOrder): Promise<FnbOrder> {
    return this.repo.save(order);
  }

  async findById(id: string): Promise<FnbOrder | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findAll(): Promise<FnbOrder[]> {
    return this.repo.find();
  }
}
