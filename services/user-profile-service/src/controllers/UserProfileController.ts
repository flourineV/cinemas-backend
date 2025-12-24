import { Request, Response } from "express";
import { UserProfileService } from "../services/UserProfileService";
import { PromotionEmailService } from "../services/PromotionEmailService";
import { AuthChecker } from "../middlewares/AuthChecker";
import { InternalAuthChecker } from "../middlewares/InternalAuthChecker";
import { UserProfileRequest } from "../dtos/request/UserProfileRequest";
import { UserProfileUpdateRequest } from "../dtos/request/UserProfileUpdateRequest";
import { UpdateLoyaltyRequest } from "../dtos/request/UpdateLoyaltyRequest";

export class UserProfileController {
  private profileService: UserProfileService;
  private internalAuthChecker: InternalAuthChecker;
  private promotionEmailService: PromotionEmailService;

  constructor(
    profileService: UserProfileService,
    internalAuthChecker: InternalAuthChecker,
    promotionEmailService: PromotionEmailService
  ) {
    this.profileService = profileService;
    this.internalAuthChecker = internalAuthChecker;
    this.promotionEmailService = promotionEmailService;
  }

  async createProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const request: UserProfileRequest = req.body;
      const profile = await this.profileService.createProfile(request);
      res.json(profile);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getProfileByUserId(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    const internalKey = req.headers["x-internal-secret"] as string | undefined;

    if (internalKey) {
      this.internalAuthChecker.requireInternal(internalKey);
      const profile = await this.profileService.getProfileByUserId(userId);
      if (profile) res.json(profile);
      else res.status(404).send();
      return;
    }

    AuthChecker.requireAuthenticated(req);
    const userRole = AuthChecker.getRoleOrNull(req);

    if (
      userRole?.toUpperCase() === "ADMIN" ||
      userRole?.toUpperCase() === "MANAGER"
    ) {
      const profile = await this.profileService.getProfileByUserId(userId);
      if (profile) res.json(profile);
      else res.status(404).send();
      return;
    }

    const currentUserId = AuthChecker.getUserIdOrThrow(req);
    if (currentUserId !== userId) {
      res.status(403).send();
      return;
    }

    const profile = await this.profileService.getProfileByUserId(userId);
    if (profile) res.json(profile);
    else res.status(404).send();
  }

  async replaceProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId = req.params.userId;
      const request: UserProfileUpdateRequest = req.body;
      const updated = await this.profileService.updateProfile(userId, request);
      res.json(updated);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async updateLoyalty(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    const request: UpdateLoyaltyRequest = req.body;
    const internalKey = req.headers["x-internal-secret"] as string | undefined;
    this.internalAuthChecker.requireInternal(internalKey);
    const updated = await this.profileService.updateLoyaltyAndRank(
      userId,
      request
    );
    res.json(updated);
  }

  async deleteProfile(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const userId = req.params.userId;
      await this.profileService.deleteProfile(userId);
      res.json({ message: "Profile deleted successfully" });
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async searchProfiles(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireManagerOrAdmin(req);
      const keyword = req.params.keyword;
      const results = await this.profileService.searchProfiles(keyword);
      res.json(results);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getUserRankAndDiscount(req: Request, res: Response): Promise<void> {
    const userId = req.params.userId;
    const response = await this.profileService.getRankAndDiscount(userId);
    res.json(response);
  }

  async getBatchUserNames(req: Request, res: Response): Promise<void> {
    const userIds: string[] = req.body;
    const internalKey = req.headers["x-internal-secret"] as string | undefined;
    this.internalAuthChecker.requireInternal(internalKey);
    const names = await this.profileService.getBatchUserNames(userIds);
    res.json(names);
  }

  async searchUserIdsByUsername(req: Request, res: Response): Promise<void> {
    const username = req.query.username as string;
    const internalKey = req.headers["x-internal-secret"] as string | undefined;
    this.internalAuthChecker.requireInternal(internalKey);
    const userIds = await this.profileService.searchUserIdsByUsername(username);
    res.json(userIds);
  }

  async updatePromoEmailPreference(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAuthenticated(req);
      const userId = req.params.userId;
      const enable = req.query.enable === "true";
      const updated = await this.profileService.updateUserPromoEmailPreference(
        userId,
        enable
      );
      res.json(updated);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async updateUserStatus(req: Request, res: Response): Promise<void> {
    try {
      AuthChecker.requireAdmin(req);
      const userId = req.params.userId;
      const status = req.query.status as string;
      const updated = await this.profileService.updateUserStatus(
        userId,
        status
      );
      res.json(updated);
    } catch (error: any) {
      res.status(403).json({ message: error.message });
    }
  }

  async getSubscribedUsersEmails(req: Request, res: Response): Promise<void> {
    const internalKey = req.headers["x-internal-secret"] as string | undefined;
    this.internalAuthChecker.requireInternal(internalKey);
    const emails = await this.promotionEmailService.getSubscribedUsersEmails();
    res.json(emails);
  }
}
