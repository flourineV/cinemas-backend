import { Router } from "express";
import { FnbOrderController } from "../controllers/FnbOrderController";
import { FnbOrderService } from "../services/FnbOrderService";
import { FnbItemRepository } from "../repositories/FnbItemRepository";
import { FnbOrderRepository } from "../repositories/FnbOrderRepository";
import { FnbProducer } from "../producers/FnbProducer";
import { AppDataSource } from "../config/database";

// Khởi tạo service và controller
const fnbItemRepository = new FnbItemRepository(AppDataSource);
const fnbOrderRepository = new FnbOrderRepository(AppDataSource);
const fnbProducer = new FnbProducer();
const fnbOrderService = new FnbOrderService(
  fnbOrderRepository,
  fnbItemRepository,
  fnbProducer
);
const fnbOrderController = new FnbOrderController(fnbOrderService);

const router = Router();

// Định nghĩa route
router.post("/", (req, res) => fnbOrderController.createOrder(req, res));
router.get("/user/:userId", (req, res) =>
  fnbOrderController.getOrdersByUser(req, res)
);
router.get("/:id", (req, res) => fnbOrderController.getById(req, res));
router.put("/:id/cancel", (req, res) =>
  fnbOrderController.cancelOrder(req, res)
);

export default router;
