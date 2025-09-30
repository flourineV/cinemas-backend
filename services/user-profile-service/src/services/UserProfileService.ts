import { AppDataSource } from "../config/database";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { UserProfile } from "../models/UserProfile.entity";

export class UserProfileService {
  private userProfileRepository: UserProfileRepository;

  constructor() {
    this.userProfileRepository = new UserProfileRepository(AppDataSource);
  }

  async createProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    return await this.userProfileRepository.create(data);
  }

  async getProfile(userId: string): Promise<UserProfile | null> {
    return await this.userProfileRepository.findByUserId(userId);
  }

  async getProfileByIdentifier(identifier: string): Promise<UserProfile | null> {
    return await this.userProfileRepository.findByEmailOrUsernameOrPhoneNumber(identifier);
  }

  async getAllProfiles(): Promise<UserProfile[]> {
    return await this.userProfileRepository.findAll();
  }

  async getActiveProfiles(): Promise<UserProfile[]> {
    return await this.userProfileRepository.findByStatus("ACTIVE");
  }

  async updateProfile(userId: string, data: Partial<UserProfile>): Promise<UserProfile | null> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) return null;
    return await this.userProfileRepository.update(profile.id, data);
  }

  async deleteProfile(userId: string): Promise<boolean> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) return false;
    await this.userProfileRepository.delete(profile.id);
    return true;
  }

  async searchProfilesByName(name: string): Promise<UserProfile[]> {
    return await this.userProfileRepository.findByFullNameContaining(name);
  }

  async addLoyaltyPoints(userId: string, points: number): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) return;
    const newPoints = (profile.loyaltyPoint || 0) + points;
    await this.userProfileRepository.update(profile.id, { loyaltyPoint: newPoints });
  }

  async updateLoyaltyPoints(userId: string, points: number): Promise<void> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) return;
    await this.userProfileRepository.update(profile.id, { loyaltyPoint: points });
  }

}
