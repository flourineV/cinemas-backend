// src/controllers/PricingController.ts
import { Request, Response, NextFunction } from "express";
import { PricingService } from "../services/PricingService";
import { SeatPriceRequest } from "../dtos/request/SeatPriceRequest";
import { AuthChecker } from "../middlewares/AuthChecker";

export class PricingController {
  private pricingService: PricingService;
  constructor(pricingService: PricingService) {
    this.pricingService = pricingService;
  }

  // lấy giá ghế
  async getSeatPrice(req: Request, res: Response, next: NextFunction) {
    const { seatType, ticketType } = req.query as {
      seatType?: string;
      ticketType?: string;
    };
    if (!seatType || !ticketType) {
      return res
        .status(400)
        .json({ message: "seatType and ticketType are required" });
    }

    const response = await this.pricingService.getSeatBasePrice(
      seatType,
      ticketType
    );
    if (!response) return res.status(404).send();
    return res.json(response);
  }

  // lấy tất cả mức giá
  async getAllSeatPrices(_req: Request, res: Response, next: NextFunction) {
    const prices = await this.pricingService.getAllSeatPrices();
    return res.json(prices);
  }

  // tạo mức giá mới
  async createSeatPrice(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { seatType, ticketType, basePrice, description } = req.body;
      const dto = new SeatPriceRequest(
        seatType,
        ticketType,
        Number(basePrice),
        description
      );
      const response = await this.pricingService.createSeatPrice(dto);
      return res.status(201).json(response);
    } catch (err: any) {
      if (err.status === 403)
        return res.status(403).json({ message: err.message });
      if (err.name === "IllegalArgumentError") return res.status(409).send();
      return res.status(500).json({ message: err.message });
    }
  }

  async updateSeatPrice(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      const { seatType, ticketType, basePrice, description } = req.body;
      const dto = new SeatPriceRequest(
        seatType,
        ticketType,
        Number(basePrice),
        description
      );
      const response = await this.pricingService.updateSeatPrice(id, dto);
      return res.json(response);
    } catch (err: any) {
      if (err.status === 403)
        return res.status(403).json({ message: err.message });
      if (err.name === "IllegalArgumentError") return res.status(404).send();
      return res.status(500).json({ message: err.message });
    }
  }

  async deleteSeatPrice(req: Request, res: Response, next: NextFunction) {
    try {
      AuthChecker.requireAdmin(req);
      const { id } = req.params;
      await this.pricingService.deleteSeatPrice(id);
      return res.status(204).send();
    } catch (err: any) {
      if (err.status === 403)
        return res.status(403).json({ message: err.message });
      if (err.name === "IllegalArgumentError") return res.status(404).send();
      return res.status(500).json({ message: err.message });
    }
  }
}
