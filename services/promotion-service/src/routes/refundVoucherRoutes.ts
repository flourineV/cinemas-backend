import { Router } from "express";
import { RefundVoucherController } from "../controllers/RefundVoucherController";
import { RefundVoucherService } from "../services/RefundVoucherService";
import { RefundVoucherRepository } from "../repositories/RefundVoucherRepository";
import { AppDataSource } from "../config/database";

// Khởi tạo service và controller
const refundVoucherService = new RefundVoucherService(
  new RefundVoucherRepository(AppDataSource)
);
const refundVoucherController = new RefundVoucherController(
  refundVoucherService
);

const router = Router();

// POST /api/promotions/refund-vouchers
router.post("/", (req, res) =>
  refundVoucherController.createRefundVoucher(req, res)
);

// GET /api/promotions/refund-vouchers
router.get("/", (req, res) =>
  refundVoucherController.getAllRefundVoucher(req, res)
);

// GET /api/promotions/refund-vouchers/user/:userId
router.get("/user/:userId", (req, res) =>
  refundVoucherController.getRefundVoucherByUser(req, res)
);

// PUT /api/promotions/refund-vouchers/use/:code
router.put("/use/:code", (req, res) =>
  refundVoucherController.markVoucherAsUsed(req, res)
);

export default router;
