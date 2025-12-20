import { DataSource, Repository } from "typeorm";
import { UserFavoriteMovie } from "../models/UserFavoriteMovie.entity";

export class UserFavoriteMovieRepository {
  private repository: Repository<UserFavoriteMovie>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserFavoriteMovie);
  }

  // Tìm danh sách phim yêu thích theo userId
  async findByUserId(userId: string): Promise<UserFavoriteMovie[]> {
    return this.repository.find({ where: { userId } });
  }

  // Đếm số phim yêu thích theo userId
  async countByUserId(userId: string): Promise<number> {
    return this.repository.count({ where: { userId } });
  }

  // Kiểm tra tồn tại theo userId và movieId
  async existsByUserIdAndMovieId(
    userId: string,
    movieId: string
  ): Promise<boolean> {
    const count = await this.repository.count({ where: { userId, movieId } });
    return count > 0;
  }

  // Xóa theo userId và movieId
  async deleteByUserIdAndMovieId(
    userId: string,
    movieId: string
  ): Promise<void> {
    await this.repository.delete({ userId, movieId });
  }

  async save(favorite: UserFavoriteMovie): Promise<UserFavoriteMovie> {
    return this.repository.save(favorite);
  }

  async findAll(): Promise<UserFavoriteMovie[]> {
    return this.repository.find();
  }
}
