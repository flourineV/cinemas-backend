import { Request, Response } from "express";
import { LoyaltyHistoryService } from "../services/LoyaltyHistoryService";
import { AuthChecker } from "../middlewares/AuthChecker";

export class LoyaltyHistoryController {
  private loyaltyHistoryService: LoyaltyHistoryService;

  constructor(loyaltyHistoryService: LoyaltyHistoryService) {
    this.loyaltyHistoryService = loyaltyHistoryService;
  }

  async getUserLoyaltyHistory(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId = req.params.userId;
      const page = parseInt(req.query.page as string) || 1;
      const size = parseInt(req.query.size as string) || 10;

      const response = await this.loyaltyHistoryService.getUserLoyaltyHistory(
        userId,
        page,
        size
      );
      res.json(response);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
