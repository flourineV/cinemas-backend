import { Request, Response } from "express";
import { UserStatsService } from "../services/UserStatsService";
import { AuthChecker } from "../middlewares/AuthChecker";
import { UserStatsResponse } from "../dtos/response/UserStatsResponse";

export class UserStatsController {
  private readonly userStatsService: UserStatsService;

  constructor(userStatsService: UserStatsService) {
    this.userStatsService = userStatsService;
  }

  // lấy thông tin thống kê
  async getOverview(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const stats: UserStatsResponse =
        await this.userStatsService.getOverviewStats();
      res.json(stats);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }
}
