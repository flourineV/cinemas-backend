import { Request, Response } from "express";
import { ManagerProfileService } from "../services/ManagerProfileService";
import { ManagerProfileRequest } from "../dtos/request/ManagerProfileRequest";
import { AuthChecker } from "../middlewares/AuthChecker";

export class ManagerProfileController {
  private managerService: ManagerProfileService;

  constructor(managerService: ManagerProfileService) {
    this.managerService = managerService;
  }

  async createManager(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const request: ManagerProfileRequest = req.body;
      const created = await this.managerService.createManager(
        request.userProfileId,
        request.managedCinemaName,
        request.hireDate
      );
      res.json(created);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getManagerByUser(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const userProfileId = req.params.userProfileId;
      const manager =
        await this.managerService.getManagerByUserProfileId(userProfileId);
      res.json(manager);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getAllManagers(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const managers = await this.managerService.getAllManagers();
      res.json(managers);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getManagersByCinema(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const cinemaName = req.params.cinemaName;
      const managers =
        await this.managerService.getManagersByCinema(cinemaName);
      res.json(managers);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async deleteManager(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const managerId = req.params.managerId;
      await this.managerService.deleteManager(managerId);
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
