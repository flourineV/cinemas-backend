import { Request, Response, NextFunction } from "express";
import { StatsService } from "../services/StatsService";
import { AuthChecker } from "../middlewares/AuthChecker";

export class StatsController {
  private statsService: StatsService;

  constructor(statsService: StatsService) {
    this.statsService = statsService;
  }

  async getOverview(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const overview = await this.statsService.getOverview();
      res.json(overview);
    } catch (err) {
      next(err);
    }
  }

  async getUserStatsByMonth(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const stats = await this.statsService.getUserRegistrationsByMonth();
      res.json(stats);
    } catch (err) {
      next(err);
    }
  }
}
