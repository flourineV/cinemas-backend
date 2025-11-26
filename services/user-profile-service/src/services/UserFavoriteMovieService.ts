import { FavoriteMovieRequest } from "../dtos/request/FavoriteMovieRequest";
import { FavoriteMovieResponse } from "../dtos/response/FavoriteMovieResponse";
import { UserFavoriteMovie } from "../models/UserFavoriteMovie.entity";
import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";
import { ResourceNotFoundException } from "../exceptions/ResourceNotFoundException";

export class UserFavoriteMovieService {
  private favoriteMovieRepository: UserFavoriteMovieRepository;

  constructor(favoriteMovieRepo: UserFavoriteMovieRepository) {
    this.favoriteMovieRepository = favoriteMovieRepo;
  }

  // Thêm phim yêu thích
  async addFavorite(
    request: FavoriteMovieRequest
  ): Promise<FavoriteMovieResponse> {
    const exists = await this.favoriteMovieRepository.existsByUserIdAndTmdbId(
      request.userId,
      request.tmdbId
    );
    if (exists) {
      throw new Error("Movie already in favorites");
    }

    const favorite = new UserFavoriteMovie();
    favorite.userId = request.userId;
    favorite.tmdbId = request.tmdbId;
    favorite.addedAt = new Date();

    const saved = await this.favoriteMovieRepository.save(favorite);
    return this.mapToResponse(saved);
  }

  // Lấy danh sách phim yêu thích theo userId
  async getFavoritesByUser(userId: string): Promise<FavoriteMovieResponse[]> {
    const favorites = await this.favoriteMovieRepository.findByUserId(userId);
    return favorites.map((fav) => this.mapToResponse(fav));
  }

  // Xóa phim yêu thích
  async removeFavorite(userId: string, tmdbId: number): Promise<void> {
    const exists = await this.favoriteMovieRepository.existsByUserIdAndTmdbId(
      userId,
      tmdbId
    );
    if (!exists) {
      throw new ResourceNotFoundException(
        `Favorite movie not found for userId: ${userId}`
      );
    }
    await this.favoriteMovieRepository.deleteByUserIdAndTmdbId(userId, tmdbId);
  }

  // Map entity sang response DTO
  private mapToResponse(entity: UserFavoriteMovie): FavoriteMovieResponse {
    if (!entity)
      throw new ResourceNotFoundException("Favorite movie entity is null");
    return new FavoriteMovieResponse(entity.tmdbId, entity.addedAt);
  }
}
