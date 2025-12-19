import { Router } from "express";
import { FnbController } from "../controllers/FnbController";
import { FnbService } from "../services/FnbService";
import { FnbItemRepository } from "../repositories/FnbItemRepository";
import { AppDataSource } from "../config/database";
// Khởi tạo service và controller
const fnbItemRepository = new FnbItemRepository(AppDataSource);
const fnbService = new FnbService(fnbItemRepository);
const fnbController = new FnbController(fnbService);

const router = Router();

// Định nghĩa route
router.post("/calculate", (req, res) =>
  fnbController.calculateFnbPrice(req, res)
);
router.get("/", (req, res) => fnbController.getAllFnbItems(req, res));
router.get("/:id", (req, res) => fnbController.getFnbItemById(req, res));
router.post("/", (req, res) => fnbController.createFnbItem(req, res));
router.put("/:id", (req, res) => fnbController.updateFnbItem(req, res));
router.delete("/:id", (req, res) => fnbController.deleteFnbItem(req, res));

export default router;
