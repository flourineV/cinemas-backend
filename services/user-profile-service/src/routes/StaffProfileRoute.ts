import { Router } from "express";
import { StaffProfileController } from "../controllers/StaffProfileController";
import { StaffProfileService } from "../services/StaffProfileService";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { AppDataSource } from "../config/database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { UserProfileService } from "../services/UserProfileService";
import { UserRankService } from "../services/UserRankService";
import { UserRankRepository } from "../repositories/UserRankRepository";
import { LoyaltyHistoryService } from "../services/LoyaltyHistoryService";
import { LoyaltyHistoryRepository } from "../repositories/LoyaltyHistoryRepository";

const router = Router();

// Khởi tạo service và controller
const staffRepo = new StaffProfileRepository(AppDataSource);
const userProfileRepo = new UserProfileRepository(AppDataSource);
const managerRepo = new ManagerProfileRepository(AppDataSource);
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
const staffService = new StaffProfileService(
  staffRepo,
  userProfileRepo,
  managerRepo,
  userProfileService
);
const staffController = new StaffProfileController(staffService);

router.post("/", (req, res) => staffController.createStaff(req, res));
router.get("/cinema/:cinemaName", (req, res) =>
  staffController.getStaffByCinema(req, res)
);
router.get("/user/:userProfileId", (req, res) =>
  staffController.getStaffByUserProfile(req, res)
);
router.get("/", (req, res) => staffController.getAllStaff(req, res));
router.delete("/:staffId", (req, res) => staffController.deleteStaff(req, res));

export default router;
