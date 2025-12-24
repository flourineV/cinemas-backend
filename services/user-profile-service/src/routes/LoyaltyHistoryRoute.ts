import { Router } from "express";
import { LoyaltyHistoryController } from "../controllers/LoyaltyHistoryController";
import { LoyaltyHistoryService } from "../services/LoyaltyHistoryService";
import { LoyaltyHistoryRepository } from "../repositories/LoyaltyHistoryRepository";
import { AppDataSource } from "../config/database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";

const router = Router();

// Khởi tạo service và controller
const loyaltyHistoryService = new LoyaltyHistoryService(
  new LoyaltyHistoryRepository(AppDataSource),
  new UserProfileRepository(AppDataSource)
);
const loyaltyHistoryController = new LoyaltyHistoryController(
  loyaltyHistoryService
);

router.get("/:userId", (req, res) =>
  loyaltyHistoryController.getUserLoyaltyHistory(req, res)
);

export default router;
