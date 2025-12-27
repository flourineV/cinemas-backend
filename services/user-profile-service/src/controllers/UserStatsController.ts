import { Request, Response } from "express";
import { UserStatsService } from "../services/UserStatsService";
import { AuthChecker } from "../middlewares/AuthChecker";

export class UserStatsController {
  private userStatsService: UserStatsService;

  constructor(userStatsService: UserStatsService) {
    this.userStatsService = userStatsService;
  }

  // async getOverview(req: Request, res: Response): Promise<void> {
  //   try {
  //     AuthChecker.requireAdmin(req);
  //     const stats = await this.userStatsService.getOverviewStats();
  //     res.json(stats);
  //   } catch (error: any) {
  //     res.status(403).json({ message: error.message });
  //   }
  // }

  async getUserStats(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId = req.params.userId;
      const stats = await this.userStatsService.getUserPersonalStats(userId);
      res.json(stats);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
