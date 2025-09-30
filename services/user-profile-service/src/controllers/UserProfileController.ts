import { Request, Response, NextFunction } from "express";
import { UserProfileService } from "../services/UserProfileService";

export class UserProfileController {
  private static userProfileService = new UserProfileService();

  static async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await this.userProfileService.createProfile(req.body);
      res.status(201).json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await this.userProfileService.getProfile(req.params.userId);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async getProfileByIdentifier(req: Request, res: Response, next: NextFunction) {
    try {
      const profile = await this.userProfileService.getProfileByIdentifier(req.params.identifier);
      if (!profile) return res.status(404).json({ message: "Profile not found" });
      res.json(profile);
    } catch (err) {
      next(err);
    }
  }

  static async getAllProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const profiles = await this.userProfileService.getAllProfiles();
      res.json(profiles);
    } catch (err) {
      next(err);
    }
  }

  static async getActiveProfiles(req: Request, res: Response, next: NextFunction) {
    try {
      const profiles = await this.userProfileService.getActiveProfiles();
      res.json(profiles);
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const updated = await this.userProfileService.updateProfile(req.params.userId, req.body);
      if (!updated) return res.status(404).json({ message: "Profile not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }

  static async deleteProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const deleted = await this.userProfileService.deleteProfile(req.params.userId);
      if (!deleted) return res.status(404).json({ message: "Profile not found" });
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  }

  static async searchProfilesByName(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await this.userProfileService.searchProfilesByName(req.query.name as string);
      res.json(results);
    } catch (err) {
      next(err);
    }
  }

  static async addLoyaltyPoints(req: Request, res: Response, next: NextFunction) {
    try {
      await this.userProfileService.addLoyaltyPoints(req.params.userId, Number(req.body.points));
      res.status(200).json({ message: "Points added" });
    } catch (err) {
      next(err);
    }
  }

  static async updateLoyaltyPoints(req: Request, res: Response, next: NextFunction) {
    try {
      await this.userProfileService.updateLoyaltyPoints(req.params.userId, Number(req.body.points));
      res.status(200).json({ message: "Points updated" });
    } catch (err) {
      next(err);
    }
  }
}
