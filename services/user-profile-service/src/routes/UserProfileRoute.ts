import { Router } from "express";
import { UserProfileController } from "../controllers/UserProfileController";
import { UserProfileService } from "../services/UserProfileService";
import { PromotionEmailService } from "../services/PromotionEmailService";
import { InternalAuthChecker } from "../middlewares/InternalAuthChecker";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";
import dotenv from "dotenv";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { UserRankService } from "../services/UserRankService";
import { UserRankRepository } from "../repositories/UserRankRepository";
import { LoyaltyHistoryService } from "../services/LoyaltyHistoryService";
import { LoyaltyHistoryRepository } from "../repositories/LoyaltyHistoryRepository";
import { AppDataSource } from "../config/database";

dotenv.config();
const router = Router();

// Khởi tạo service và controller
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
const internalAuthChecker = new InternalAuthChecker(
  process.env.INTERNAL_SECRET_KEY!
);
const promotionEmailService = new PromotionEmailService(userProfileRepo);
const userProfileController = new UserProfileController(
  userProfileService,
  internalAuthChecker,
  promotionEmailService
);

router.post("/", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  userProfileController.createProfile(req, res)
);
router.get("/:userId", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  userProfileController.getProfileByUserId(req, res)
);
router.put("/:userId", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  userProfileController.replaceProfile(req, res)
);
router.patch("/:userId/loyalty", (req, res) =>
  userProfileController.updateLoyalty(req, res)
);
router.delete(
  "/:userId",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => userProfileController.deleteProfile(req, res)
);
router.get("/search", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  userProfileController.searchProfiles(req, res)
);

router.get("/:userId/rank", (req, res) =>
  userProfileController.getUserRankAndDiscount(req, res)
);

router.post("/batch/names", (req, res) =>
  userProfileController.getBatchUserNames(req, res)
);

router.get("/batch/search-userids", (req, res) =>
  userProfileController.searchUserIdsByUsername(req, res)
);
router.patch(
  "/:userId/settings/promo-email",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => userProfileController.updatePromoEmailPreference(req, res)
);
router.patch(
  "/:userId/status",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => userProfileController.updateUserStatus(req, res)
);

router.get("/subscribed-emails", (req, res) =>
  userProfileController.getSubscribedUsersEmails(req, res)
);

export default router;
