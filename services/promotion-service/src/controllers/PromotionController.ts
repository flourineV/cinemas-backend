import { Request, Response } from "express";
import { PromotionService } from "../services/PromotionService";
import { PromotionRequest } from "../dtos/request/PromotionRequest";
import { AuthChecker } from "../middlewares/AuthChecker";

export class PromotionController {
  private promotionService: PromotionService;

  constructor(promotionService: PromotionService) {
    this.promotionService = promotionService;
  }

  async validatePromotion(req: Request, res: Response): Promise<void> {
    try {
      const code = req.query.code as string;
      const response = await this.promotionService.validatePromotionCode(code);
      res.json(response);
    } catch (error: any) {
      res.status(404).send();
    }
  }

  async getAllPromotions(req: Request, res: Response): Promise<void> {
    const promotions = await this.promotionService.getAllPromotions();
    res.json(promotions);
  }

  async getActivePromotions(req: Request, res: Response): Promise<void> {
    const promotions = await this.promotionService.getActivePromotions();
    res.json(promotions);
  }

  async getActivePromotionsForUser(req: Request, res: Response): Promise<void> {
    const userId = req.query.userId as string;
    const response =
      await this.promotionService.getActivePromotionsForUser(userId);
    res.json(response);
  }

  async getAllPromotionsForAdmin(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const { code, discountType, promotionType, isActive } = req.query;
      const promotions = await this.promotionService.getAllPromotionsForAdmin(
        code as string,
        discountType as string,
        promotionType as string,
        isActive ? isActive === "true" : undefined
      );
      res.json(promotions);
    } catch (error: any) {
      res.status(403).json({ message: "Forbidden" });
    }
  }

  async createPromotion(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const request: PromotionRequest = req.body;
      const response = await this.promotionService.createPromotion(request);
      res.status(201).json(response);
    } catch (error: any) {
      res.status(409).send(); // conflict
    }
  }

  async updatePromotion(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const id = req.params.id;
      const request: PromotionRequest = req.body;
      const response = await this.promotionService.updatePromotion(id, request);
      res.json(response);
    } catch (error: any) {
      res.status(404).send();
    }
  }

  async deletePromotion(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const id = req.params.id;
      await this.promotionService.deletePromotion(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).send();
    }
  }
}
