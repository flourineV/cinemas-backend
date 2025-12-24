import { Request, Response } from "express";
import { FnbService } from "../services/FnbService";
import { AuthChecker } from "../middlewares/AuthChecker";

export class FnbController {
  private fnbService: FnbService;

  constructor(fnbService: FnbService) {
    this.fnbService = fnbService;
  }

  async calculateFnbPrice(req: Request, res: Response): Promise<void> {
    try {
      const response = await this.fnbService.calculateTotalPrice(
        req.body.selectedFnbItems
      );
      res.json(response);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getAllFnbItems(req: Request, res: Response): Promise<void> {
    const items = await this.fnbService.getAllFnbItems();
    res.json(items);
  }

  async getFnbItemById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const item = await this.fnbService.getFnbItemById(id);
      res.json(item);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async createFnbItem(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const item = await this.fnbService.createFnbItem(req.body);
      res.status(201).json(item);
    } catch (error: any) {
      if (error.message.includes("exists")) {
        res.status(409).json({ message: error.message });
      } else {
        res.status(400).json({ message: error.message });
      }
    }
  }

  async updateFnbItem(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      const item = await this.fnbService.updateFnbItem(id, req.body);
      res.json(item);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async deleteFnbItem(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      await this.fnbService.deleteFnbItem(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }
}
