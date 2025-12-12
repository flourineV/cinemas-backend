import { Router } from "express";
import { PricingController } from "../controllers/PricingController";
import { SeatPriceRepository } from "../repositories/SeatPriceRepository";
import { AppDataSource } from "../config/database";
import { PricingService } from "../services/PricingService";

const router = Router();
const pricingRepo = new SeatPriceRepository(AppDataSource);
const pricingService = new PricingService(pricingRepo);
const pricingController = new PricingController(pricingService);

router.get("/seat-price", (req, res, next) =>
  pricingController.getSeatPrice(req, res, next)
);
router.get("/", (req, res, next) =>
  pricingController.getAllSeatPrices(req, res, next)
);

// Admin
router.post("/", (req, res, next) =>
  pricingController.createSeatPrice(req, res, next)
);
router.put("/:id", (req, res, next) =>
  pricingController.updateSeatPrice(req, res, next)
);
router.delete("/:id", (req, res, next) =>
  pricingController.deleteSeatPrice(req, res, next)
);

export default router;
