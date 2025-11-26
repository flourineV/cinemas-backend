import { Request, Response } from "express";
import { ManagerProfileService } from "../services/ManagerProfileService";
import { AuthChecker } from "../middlewares/AuthChecker";
import { ManagerProfileRequest } from "../dtos/request/ManagerProfileRequest";
import { ManagerProfile } from "../models/ManagerProfile.entity";

export class ManagerProfileController {
  private readonly managerService: ManagerProfileService;

  constructor(managerService: ManagerProfileService) {
    this.managerService = managerService;
  }

  async createManager(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const request: ManagerProfileRequest = req.body;
      const created: ManagerProfile = await this.managerService.createManager(
        request.userProfileId,
        request.managedCinemaId,
        request.hireDate
      );
      res.json(created);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async getManagerByUser(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const userProfileId: string = req.params.userProfileId;
      const manager: ManagerProfile =
        await this.managerService.getManagerByUserProfileId(userProfileId);
      res.json(manager);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async getAllManagers(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const managers: ManagerProfile[] =
        await this.managerService.getAllManagers();
      res.json(managers);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async getManagersByCinema(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const cinemaId: string = req.params.cinemaId;
      const managers: ManagerProfile[] =
        await this.managerService.getManagersByCinema(cinemaId);
      res.json(managers);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async deleteManager(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const managerId: string = req.params.managerId;
      await this.managerService.deleteManager(managerId);
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }
}
