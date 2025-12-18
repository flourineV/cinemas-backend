import { Request, Response } from "express";
import { RefundVoucherService } from "../services/RefundVoucherService";
import { RefundVoucherRequest } from "../dtos/request/RefundVoucherRequest";

export class RefundVoucherController {
  private refundVoucherService: RefundVoucherService;

  constructor(refundVoucherService: RefundVoucherService) {
    this.refundVoucherService = refundVoucherService;
  }

  async createRefundVoucher(req: Request, res: Response): Promise<void> {
    try {
      const request: RefundVoucherRequest = req.body;
      const response =
        await this.refundVoucherService.createRefundVoucher(request);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAllRefundVoucher(req: Request, res: Response): Promise<void> {
    const vouchers = await this.refundVoucherService.getAllVouchers();
    res.json(vouchers);
  }

  async getRefundVoucherByUser(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    const vouchers = await this.refundVoucherService.getVouchersByUser(userId);
    res.json(vouchers);
  }

  async markVoucherAsUsed(req: Request, res: Response): Promise<void> {
    try {
      const code = req.params.code;
      const response = await this.refundVoucherService.markAsUsed(code);
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
