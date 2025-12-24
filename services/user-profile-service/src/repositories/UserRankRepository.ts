import { DataSource, Repository } from "typeorm";
import { UserRank } from "../models/UserRank.entity";

export class UserRankRepository {
  private repository: Repository<UserRank>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserRank);
  }

  // Tìm theo name
  async findByName(name: string): Promise<UserRank | null> {
    return this.repository.findOne({ where: { name } });
  }

  // Tìm rank mặc định (ví dụ minPoints = 0)
  async findByMinPoints(minPoints: number): Promise<UserRank | null> {
    return this.repository.findOne({ where: { minPoints } });
  }

  // Tìm rank tốt nhất theo điểm số hiện tại của người dùng
  async findBestRankByPoints(points: number): Promise<UserRank | null> {
    return this.repository
      .createQueryBuilder("r")
      .where("r.minPoints <= :points", { points })
      .orderBy("r.minPoints", "DESC")
      .limit(1)
      .getOne();
  }

  // Lưu hoặc cập nhật rank
  async save(rank: UserRank): Promise<UserRank> {
    return this.repository.save(rank);
  }

  // Xóa rank theo id
  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // Lấy tất cả rank
  async findAll(): Promise<UserRank[]> {
    return this.repository.find();
  }

  // Tìm theo id
  async findById(id: string): Promise<UserRank | null> {
    return this.repository.findOne({ where: { id } });
  }
}
