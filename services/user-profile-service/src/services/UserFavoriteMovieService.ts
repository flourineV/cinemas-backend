import { UserFavoriteMovie } from "../models/UserFavoriteMovie.entity";
import { FavoriteMovieRequest } from "../dtos/request/FavoriteMovieRequest";
import { FavoriteMovieResponse } from "../dtos/response/FavoriteMovieResponse";
import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";

export class UserFavoriteMovieService {
  private favoriteMovieRepository: UserFavoriteMovieRepository;
  private userProfileRepository: UserFavoriteMovieRepository;
  constructor(
    favoriteMovieRepository: UserFavoriteMovieRepository,
    userProfileRepository: UserFavoriteMovieRepository
  ) {
    this.favoriteMovieRepository = favoriteMovieRepository;
    this.userProfileRepository = userProfileRepository;
  }

  async addFavorite(
    request: FavoriteMovieRequest
  ): Promise<FavoriteMovieResponse> {
    const exists = await this.favoriteMovieRepository.existsByUserIdAndMovieId(
      request.userId,
      request.movieId
    );
    if (exists) {
      throw new Error("Movie already in favorites");
    }

    // Verify user profile exists
    const user = await this.userProfileRepository.existsByUserIdAndMovieId(
      request.userId,
      request.movieId
    );
    if (!user) {
      throw new Error(`User profile not found for userId: ${request.userId}`);
    }

    const favorite: UserFavoriteMovie = {
      userId: request.userId,
      movieId: request.movieId,
      addedAt: new Date(),
    };

    const saved = await this.favoriteMovieRepository.save(favorite);
    return this.mapToResponse(saved);
  }

  async getFavoritesByUser(userId: string): Promise<FavoriteMovieResponse[]> {
    const favorites = await this.favoriteMovieRepository.findByUserId(userId);
    return favorites.map((f) => this.mapToResponse(f));
  }

  async removeFavorite(userId: string, movieId: string): Promise<void> {
    const exists = await this.favoriteMovieRepository.existsByUserIdAndMovieId(
      userId,
      movieId
    );
    if (!exists) {
      throw new Error(`Favorite movie not found for userId: ${userId}`);
    }
    await this.favoriteMovieRepository.deleteByUserIdAndMovieId(
      userId,
      movieId
    );
  }

  async isFavorite(userId: string, movieId: string): Promise<boolean> {
    const exists = await this.favoriteMovieRepository.existsByUserIdAndMovieId(
      userId,
      movieId
    );
    return exists;
  }

  private mapToResponse(entity: UserFavoriteMovie): FavoriteMovieResponse {
    return new FavoriteMovieResponse(entity.movieId, entity.addedAt);
  }
}
