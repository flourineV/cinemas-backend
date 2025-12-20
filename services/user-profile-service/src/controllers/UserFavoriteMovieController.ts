// import { Request, Response } from "express";
// import { UserFavoriteMovieService } from "../services/UserFavoriteMovieService";
// import { AuthChecker } from "../middlewares/AuthChecker";
// import { FavoriteMovieRequest } from "../dtos/request/FavoriteMovieRequest";
// import { FavoriteMovieResponse } from "../dtos/response/FavoriteMovieResponse";

// export class UserFavoriteMovieController {
//   private readonly favoriteMovieService: UserFavoriteMovieService;

//   constructor(favoriteMovieService: UserFavoriteMovieService) {
//     this.favoriteMovieService = favoriteMovieService;
//   }

//   async addFavorite(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireAuthenticated(req); // kiểm tra user đã đăng nhập
//       const request: FavoriteMovieRequest = req.body;
//       const favorite: FavoriteMovieResponse =
//         await this.favoriteMovieService.addFavorite(request);
//       res.json(favorite);
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }

//   async getFavorites(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireAuthenticated(req);
//       const userId: string = req.params.userId;
//       const favorites: FavoriteMovieResponse[] =
//         await this.favoriteMovieService.getFavoritesByUser(userId);
//       res.json(favorites);
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }

//   async removeFavorite(req: Request, res: Response): Promise<void> {
//     try {
//       AuthChecker.requireAuthenticated(req);
//       const userId: string = req.params.userId;
//       const tmdbId: number = parseInt(req.params.tmdbId, 10);
//       await this.favoriteMovieService.removeFavorite(userId, tmdbId);
//       res.status(204).send();
//     } catch (error: any) {
//       res.status(403).json({ message: error.message || "Forbidden" });
//     }
//   }
// }
