import { Request, Response } from "express";
import { StaffProfileService } from "../services/StaffProfileService";
import { StaffProfileRequest } from "../dtos/request/StaffProfileRequest";
import { AuthChecker } from "../middlewares/AuthChecker";

export class StaffProfileController {
  private staffService: StaffProfileService;

  constructor(staffService: StaffProfileService) {
    this.staffService = staffService;
  }

  async createStaff(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const request: StaffProfileRequest = req.body;
      const created = await this.staffService.createStaff(
        request.userProfileId,
        request.cinemaName,
        request.hireDate
      );
      res.json(created);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getStaffByCinema(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const cinemaName = req.params.cinemaName;
      const currentUserId = AuthChecker.getUserIdOrThrow(req);
      const userRole = AuthChecker.getRoleOrNull(req);
      const staff = await this.staffService.getStaffByCinema(
        cinemaName,
        currentUserId,
        userRole
      );
      res.json(staff);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getStaffByUserProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const userProfileId = req.params.userProfileId;
      const staff =
        await this.staffService.getStaffByUserProfileId(userProfileId);
      res.json(staff);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getAllStaff(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const currentUserId = AuthChecker.getUserIdOrThrow(req);
      const userRole = AuthChecker.getRoleOrNull(req);
      const staff = await this.staffService.getAllStaff(
        currentUserId,
        userRole
      );
      res.json(staff);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async deleteStaff(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const staffId = req.params.staffId;
      await this.staffService.deleteStaff(staffId);
      res.status(204).send();
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }
}
