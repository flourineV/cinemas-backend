import { Request, Response } from "express";
import { UserProfileService } from "../services/UserProfileService";
import { AuthChecker } from "../middlewares/AuthChecker";
import { InternalAuthChecker } from "../middlewares/InternalAuthChecker";
import { UserProfileRequest } from "../dtos/request/UserProfileRequest";
import { UserProfileUpdateRequest } from "../dtos/request/UserProfileUpdateRequest";
import { UserProfileResponse } from "../dtos/response/UserProfileResponse";
import { RankAndDiscountResponse } from "../dtos/response/RankAndDiscountResponse";

export class UserProfileController {
  private readonly profileService: UserProfileService;
  private readonly internalAuthChecker: InternalAuthChecker;

  constructor(
    profileService: UserProfileService,
    internalAuthChecker: InternalAuthChecker
  ) {
    this.profileService = profileService;
    this.internalAuthChecker = internalAuthChecker;
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const request: UserProfileRequest = req.body;
      const profile: UserProfileResponse =
        await this.profileService.createProfile(request);
      res.json(profile);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async getProfileByUserId(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId: string = req.params.userId;
      const profile = await this.profileService.getProfileByUserId(userId);
      if (profile) {
        res.json(profile);
      } else {
        res.status(404).send();
      }
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async replaceProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId: string = req.params.userId;
      const request: UserProfileUpdateRequest = req.body;
      const updated: UserProfileResponse =
        await this.profileService.updateProfile(userId, request);
      res.json(updated);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async updateLoyalty(req: Request, res: Response): Promise<void> {
    try {
      const userId: string = req.params.userId;
      const loyaltyPoint: number = req.body;
      const internalKey: string | undefined = req.header("X-Internal-Secret");
      this.internalAuthChecker.requireInternal(internalKey);
      const updated: UserProfileResponse =
        await this.profileService.updateLoyaltyAndRank(userId, loyaltyPoint);
      res.json(updated);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const userId: string = req.params.userId;
      await this.profileService.deleteProfile(userId);
      res.json({ message: "Profile deleted successfully" });
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async searchProfiles(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const keyword: string | undefined = req.query.keyword as string;
      const results: UserProfileResponse[] =
        await this.profileService.searchProfiles(keyword);
      res.json(results);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }

  async getUserRankAndDiscount(req: Request, res: Response): Promise<void> {
    try {
      const userId: string = req.params.userId;
      const response: RankAndDiscountResponse =
        await this.profileService.getRankAndDiscount(userId);
      res.json(response);
    } catch (error: any) {
      res.status(403).json({ message: error.message || "Forbidden" });
    }
  }
}
