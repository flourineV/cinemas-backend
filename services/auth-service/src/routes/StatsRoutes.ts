import { Router } from "express";
import { StatsController } from "../controllers/StatsController";
import { StatsService } from "../services/StatsService";
import { UserRepository } from "../repositories/UserRepository";
import { AppDataSource } from "../config/Database";

const router = Router();

const userRepository = new UserRepository(AppDataSource);
const statsService = new StatsService(userRepository);
// tạo controller
const statsController = new StatsController(statsService);

// thống kê user
router.get("/overview", (req, res, next) =>
  statsController.getOverview(req, res, next)
);

// thống kê theo tháng
router.get("/users/monthly", (req, res, next) =>
  statsController.getUserStatsByMonth(req, res, next)
);

export default router;
