import { Router } from "express";
import { UsedPromotionController } from "../controllers/UsedPromotionController";
import { UsedPromotionService } from "../services/UsedPromotionService";
import { UsedPromotionRepository } from "../repositories/UsedPromotionRepository";
import { PromotionRepository } from "../repositories/PromotionRepository";
import { AppDataSource } from "../config/database";

// Khởi tạo service và controller
const usedPromotionService = new UsedPromotionService(
  new UsedPromotionRepository(AppDataSource),
  new PromotionRepository(AppDataSource)
);
const usedPromotionController = new UsedPromotionController(
  usedPromotionService
);

const router = Router();

// GET /api/promotions/usage/can-use?userId=...&promotionCode=...
router.get("/can-use", (req, res) =>
  usedPromotionController.canUsePromotion(req, res)
);

// POST /api/promotions/usage/record
router.post("/record", (req, res) =>
  usedPromotionController.recordPromotionUsage(req, res)
);

// PATCH /api/promotions/usage/update-status
router.patch("/update-status", (req, res) =>
  usedPromotionController.updateBookingStatus(req, res)
);

// GET /api/promotions/usage/booking/:bookingId
router.get("/booking/:bookingId", (req, res) =>
  usedPromotionController.getByBookingId(req, res)
);

export default router;
