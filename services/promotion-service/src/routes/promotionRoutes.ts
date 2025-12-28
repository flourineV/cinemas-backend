import { Router } from "express";
import { PromotionController } from "../controllers/PromotionController";
import { PromotionService } from "../services/PromotionService";
import { PromotionRepository } from "../repositories/PromotionRepository";
import { UsedPromotionRepository } from "../repositories/UsedPromotionRepository";
import { PromotionNotificationHelper } from "../services/PromotionNotificationHelper";
import { NotificationClient } from "../config/NotificationClient";
import { AppDataSource } from "../config/database";
import { JwtMiddleware } from "../middlewares/JwtMiddleware";

// Khởi tạo service và controller
const promotionService = new PromotionService(
  new PromotionRepository(AppDataSource),
  new UsedPromotionRepository(AppDataSource),
  new PromotionNotificationHelper(new NotificationClient("https://cinehub.com"))
);
const promotionController = new PromotionController(promotionService);

const router = Router();

// GET /api/promotions/validate?code=...
router.get("/validate", (req, res) =>
  promotionController.validatePromotion(req, res)
);

// GET /api/promotions
router.get("/", (req, res) => promotionController.getAllPromotions(req, res));

// GET /api/promotions/active
router.get("/active", (req, res) =>
  promotionController.getActivePromotions(req, res)
);

// GET /api/promotions/active-for-user?userId=...
router.get("/active-for-user", (req, res) =>
  promotionController.getActivePromotionsForUser(req, res)
);

// GET /api/promotions/admin/all
router.get(
  "/admin/all",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  (req, res) => promotionController.getAllPromotionsForAdmin(req, res)
);

// POST /api/promotions
router.post("/", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  promotionController.createPromotion(req, res)
);

// PUT /api/promotions/:id
router.put("/:id", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  promotionController.updatePromotion(req, res)
);

// DELETE /api/promotions/:id
router.delete("/:id", JwtMiddleware(process.env.APP_JWT_SECRET!), (req, res) =>
  promotionController.deletePromotion(req, res)
);

export default router;
