import { Router } from "express";
import { UserFavoriteMovieController } from "../controllers/UserFavoriteMovieController";
import { UserFavoriteMovieService } from "../services/UserFavoriteMovieService";
import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";
import { AppDataSource } from "../config/database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";

const router = Router();

// Khởi tạo service và controller
const favoriteMovieService = new UserFavoriteMovieService(
  new UserFavoriteMovieRepository(AppDataSource),
  new UserProfileRepository(AppDataSource)
);
const favoriteMovieController = new UserFavoriteMovieController(
  favoriteMovieService
);

router.post("/", (req, res) => favoriteMovieController.addFavorite(req, res));
router.get("/:userId", (req, res) =>
  favoriteMovieController.getFavorites(req, res)
);
router.delete("/:userId/:movieId", (req, res) =>
  favoriteMovieController.removeFavorite(req, res)
);
router.get("/check/:userId/:movieId", (req, res) =>
  favoriteMovieController.isFavorite(req, res)
);

export default router;
