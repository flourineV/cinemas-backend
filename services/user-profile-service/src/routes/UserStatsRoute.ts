import { Router } from "express";
import { UserStatsController } from "../controllers/UserStatsController";
import { UserStatsService } from "../services/UserStatsService";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import app from "../app";
import { AppDataSource } from "../config/database";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";
import { BookingClient } from "../client/BookingClient";

const router = Router();

// Khởi tạo service và controller
const userStatsService = new UserStatsService(
  new UserProfileRepository(AppDataSource),
  new ManagerProfileRepository(AppDataSource),
  new StaffProfileRepository(AppDataSource),
  new UserFavoriteMovieRepository(AppDataSource),
  new BookingClient()
);
const userStatsController = new UserStatsController(userStatsService);

router.get("/overview", (req, res) =>
  userStatsController.getOverview(req, res)
);
router.get("/user/:userId", (req, res) =>
  userStatsController.getUserStats(req, res)
);

export default router;
