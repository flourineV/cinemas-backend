import { Router, Request, Response } from "express";
import { UserStatsController } from "../controllers/UserStatsController";
import { UserStatsService } from "../services/UserStatsService";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { AppDataSource } from "../config/Database";

const router = Router();

const userProfileRepo = new UserProfileRepository(AppDataSource);
const managerRepo = new ManagerProfileRepository(AppDataSource);
const staffRepo = new StaffProfileRepository(AppDataSource);

const userStatsService = new UserStatsService(
  userProfileRepo,
  managerRepo,
  staffRepo
);
const controller = new UserStatsController(userStatsService);

router.get("/overview", (req: Request, res: Response) => {
  controller.getOverview(req, res);
});

export default router;
