import { Router } from "express";
import { UserFavoriteMovieController } from "../controllers/UserFavoriteMovieController";
import { UserFavoriteMovieService } from "../services/UserFavoriteMovieService";
import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";
import { AppDataSource } from "../config/database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";

const router = Router();

// Khởi tạo service và controller
const favoriteMovieService = new UserFavoriteMovieService(
  new UserFavoriteMovieRepository(AppDataSource),
  new UserProfileRepository(AppDataSource)
);
const favoriteMovieController = new UserFavoriteMovieController(
  favoriteMovieService
);

router.post("/", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  favoriteMovieController.addFavorite(req, res)
);
router.get("/:userId", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  favoriteMovieController.getFavorites(req, res)
);
router.delete(
  "/:userId/:movieId",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => favoriteMovieController.removeFavorite(req, res)
);
router.get(
  "/check/:userId/:movieId",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => favoriteMovieController.isFavorite(req, res)
);

export default router;
