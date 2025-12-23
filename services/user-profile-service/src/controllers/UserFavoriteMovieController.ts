import { Request, Response } from "express";
import { UserFavoriteMovieService } from "../services/UserFavoriteMovieService";
import { FavoriteMovieRequest } from "../dtos/request/FavoriteMovieRequest";
import { AuthChecker } from "../middlewares/AuthChecker";

export class UserFavoriteMovieController {
  private favoriteMovieService: UserFavoriteMovieService;

  constructor(favoriteMovieService: UserFavoriteMovieService) {
    this.favoriteMovieService = favoriteMovieService;
  }

  async addFavorite(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const request: FavoriteMovieRequest = req.body;
      const result = await this.favoriteMovieService.addFavorite(request);
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getFavorites(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId = req.params.userId;
      const favorites =
        await this.favoriteMovieService.getFavoritesByUser(userId);
      res.json(favorites);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async removeFavorite(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const { userId, movieId } = req.params;
      await this.favoriteMovieService.removeFavorite(userId, movieId);
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async isFavorite(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const { userId, movieId } = req.params;
      const result = await this.favoriteMovieService.isFavorite(
        userId,
        movieId
      );
      res.json(result);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
