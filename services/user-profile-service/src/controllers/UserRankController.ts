import { Request, Response } from "express";
import { UserRankService } from "../services/UserRankService";
import { RankRequest } from "../dtos/request/RankRequest";
import { AuthChecker } from "../middlewares/AuthChecker";

export class UserRankController {
  private rankService: UserRankService;

  constructor(rankService: UserRankService) {
    this.rankService = rankService;
  }

  async createRank(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req); // kiểm tra quyền admin
      const request: RankRequest = req.body;
      const rank = await this.rankService.createRank(request);
      res.json(rank);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getAllRanks(req: Request, res: Response): Promise<void> {
    const ranks = await this.rankService.getAllRanks();
    res.json(ranks);
  }

  async getRankById(req: Request, res: Response): Promise<void> {
    const rankId = req.params.rankId;
    const rank = await this.rankService.getRankById(rankId);
    res.json(rank);
  }

  async deleteRank(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const rankId = req.params.rankId;
      await this.rankService.deleteRank(rankId);
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
