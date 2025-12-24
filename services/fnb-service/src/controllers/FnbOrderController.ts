import { Request, Response } from "express";
import { FnbOrderService } from "../services/FnbOrderService";

export class FnbOrderController {
  private fnbOrderService: FnbOrderService;

  constructor(fnbOrderService: FnbOrderService) {
    this.fnbOrderService = fnbOrderService;
  }

  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderResponse = await this.fnbOrderService.createOrder(req.body);
      res.status(201).json(orderResponse);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }

  async getOrdersByUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      const orders = await this.fnbOrderService.getOrdersByUser(userId);
      res.json(orders);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const order = await this.fnbOrderService.getById(id);
      res.json(order);
    } catch (error: any) {
      res.status(404).json({ message: error.message });
    }
  }

  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await this.fnbOrderService.cancelOrder(id);
      res.status(204).send();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  }
}
