import { Router } from "express";
import { ManagerProfileController } from "../controllers/ManagerProfileController";
import { ManagerProfileService } from "../services/ManagerProfileService";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { AppDataSource } from "../config/database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { UserProfileService } from "../services/UserProfileService";
import { UserRankService } from "../services/UserRankService";
import { UserRankRepository } from "../repositories/UserRankRepository";
import { LoyaltyHistoryService } from "../services/LoyaltyHistoryService";
import { LoyaltyHistoryRepository } from "../repositories/LoyaltyHistoryRepository";

const router = Router();

// Khởi tạo service và controller
const managerRepo = new ManagerProfileRepository(AppDataSource);
const userProfileRepo = new UserProfileRepository(AppDataSource);
const userRankService = new UserRankService(
  new UserRankRepository(AppDataSource)
);
const loyaltyHistoryService = new LoyaltyHistoryService(
  new LoyaltyHistoryRepository(AppDataSource),
  userProfileRepo
);
const userProfileService = new UserProfileService(
  userProfileRepo,
  userRankService,
  loyaltyHistoryService
);
const managerService = new ManagerProfileService(
  managerRepo,
  userProfileRepo,
  userProfileService
);
const managerController = new ManagerProfileController(managerService);

router.post("/", (req, res) => managerController.createManager(req, res));
router.get("/user/:userProfileId", (req, res) =>
  managerController.getManagerByUser(req, res)
);
router.get("/", (req, res) => managerController.getAllManagers(req, res));
router.get("/cinema/:cinemaName", (req, res) =>
  managerController.getManagersByCinema(req, res)
);
router.delete("/:managerId", (req, res) =>
  managerController.deleteManager(req, res)
);

export default router;
