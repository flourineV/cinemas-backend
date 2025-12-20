// import { Router, Request, Response } from "express";
// import { UserFavoriteMovieController } from "../controllers/UserFavoriteMovieController";
// import { UserFavoriteMovieService } from "../services/UserFavoriteMovieService";
// import { AppDataSource } from "../config/Database";
// import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";

// const router = Router();
// const favorMovieRepo = new UserFavoriteMovieRepository(AppDataSource);
// const favoriteMovieService = new UserFavoriteMovieService(favorMovieRepo);
// const controller = new UserFavoriteMovieController(favoriteMovieService);

// router.post("/", (req: Request, res: Response) =>
//   controller.addFavorite(req, res)
// );
// router.get("/:userId", (req: Request, res: Response) =>
//   controller.getFavorites(req, res)
// );
// router.delete("/:userId/:tmdbId", (req: Request, res: Response) =>
//   controller.removeFavorite(req, res)
// );

// export default router;
