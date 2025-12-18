import { Request, Response } from "express";
import { UsedPromotionService } from "../services/UsedPromotionService";
import { RecordPromotionUsageRequest } from "../dtos/request/RecordPromotionUsageRequest";
import { UpdatePromotionUsageStatusRequest } from "../dtos/request/UpdatePromotionUsageStatusRequest";

export class UsedPromotionController {
  private usedPromotionService: UsedPromotionService;

  constructor(usedPromotionService: UsedPromotionService) {
    this.usedPromotionService = usedPromotionService;
  }

  async canUsePromotion(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId as string;
      const promotionCode = req.query.promotionCode as string;
      const canUse = await this.usedPromotionService.canUsePromotion(
        userId,
        promotionCode
      );
      res.json(canUse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async recordPromotionUsage(req: Request, res: Response): Promise<void> {
    try {
      const request: RecordPromotionUsageRequest = req.body;
      const response =
        await this.usedPromotionService.recordPromotionUsage(request);
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async updateBookingStatus(req: Request, res: Response): Promise<void> {
    try {
      const request: UpdatePromotionUsageStatusRequest = req.body;
      await this.usedPromotionService.updateBookingStatus(request);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getByBookingId(req: Request, res: Response): Promise<void> {
    try {
      const bookingId = req.params.bookingId;
      const response =
        await this.usedPromotionService.getByBookingId(bookingId);
      if (response) {
        res.json(response);
      } else {
        res.status(404).json({ message: "Promotion usage not found" });
      }
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
