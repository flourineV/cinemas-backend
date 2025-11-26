import { DataSource, Repository } from "typeorm";
import { UserRank } from "../models/UserRank.entity";

export class UserRankRepository {
  private repository: Repository<UserRank>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserRank);
  }

  // Lưu rank
  async save(rank: UserRank): Promise<UserRank> {
    return await this.repository.save(rank);
  }

  // tìm rank bằng id
  async findById(rankId: string): Promise<UserRank | null> {
    return await this.repository.findOne({ where: { id: rankId } });
  }

  // lấy tất cả rank
  async findAll(): Promise<UserRank[]> {
    return await this.repository.find();
  }

  // Xóa rank
  async delete(rank: UserRank): Promise<void> {
    await this.repository.remove(rank);
  }

  // Tìm theo name
  async findByName(name: string): Promise<UserRank | null> {
    return await this.repository.findOne({ where: { name } });
  }

  // Tìm rank mặc định (min = 0)
  async findByMinPoints(minPoints: number): Promise<UserRank | null> {
    return await this.repository.findOne({ where: { minPoints } });
  }

  // Tìm rank tốt nhất theo điểm số hiện tại
  async findBestRankByPoints(points: number): Promise<UserRank | null> {
    return await this.repository
      .createQueryBuilder("r")
      .where("r.minPoints <= :points", { points })
      .orderBy("r.minPoints", "DESC")
      .limit(1)
      .getOne();
  }
}
