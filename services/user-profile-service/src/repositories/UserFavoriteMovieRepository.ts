import { DataSource, Repository } from "typeorm";
import { UserFavoriteMovie } from "../models/UserFavoriteMovie.entity";

export class UserFavoriteMovieRepository {
  private repository: Repository<UserFavoriteMovie>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserFavoriteMovie);
  }

  // Lưu favorite movie
  async save(favorite: UserFavoriteMovie): Promise<UserFavoriteMovie> {
    return await this.repository.save(favorite);
  }
  
  // Tìm tất cả favorite movies theo userId
  async findByUserId(userId: string): Promise<UserFavoriteMovie[]> {
    return await this.repository.find({
      where: { userId },
    });
  }

  // Kiểm tra tồn tại theo composite key (userId + tmdbId)
  async existsByUserIdAndTmdbId(userId: string, tmdbId: number): Promise<boolean> {
    const count = await this.repository.count({
      where: { userId, tmdbId },
    });
    return count > 0;
  }

  // Xóa theo composite key (userId + tmdbId)
  async deleteByUserIdAndTmdbId(userId: string, tmdbId: number): Promise<void> {
    await this.repository.delete({ userId, tmdbId });
  }
}
