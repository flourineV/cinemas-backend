import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { UserRankService } from "./UserRankService";
import { LoyaltyHistoryService } from "./LoyaltyHistoryService";

import { UserProfileRequest } from "../dtos/request/UserProfileRequest";
import { UserProfileUpdateRequest } from "../dtos/request/UserProfileUpdateRequest";
import { UpdateLoyaltyRequest } from "../dtos/request/UpdateLoyaltyRequest";

import { UserProfileResponse } from "../dtos/response/UserProfileResponse";
import { RankAndDiscountResponse } from "../dtos/response/RankAndDiscountResponse";
import { PromoEmailResponse } from "../dtos/response/PromoEmailResponse";

import { UserProfile } from "../models/UserProfile.entity";
import { UserRank } from "../models/UserRank.entity";
export class UserProfileService {
  private profileRepository: UserProfileRepository;
  private rankService: UserRankService;
  private loyaltyHistoryService: LoyaltyHistoryService;
  constructor(
    profileRepository: UserProfileRepository,
    rankService: UserRankService,
    loyaltyHistoryService: LoyaltyHistoryService
  ) {
    this.profileRepository = profileRepository;
    this.rankService = rankService;
    this.loyaltyHistoryService = loyaltyHistoryService;
  }

  async createProfile(
    request: UserProfileRequest
  ): Promise<UserProfileResponse> {
    const exists = await this.profileRepository.existsByUserId(request.userId);
    if (exists) {
      throw new Error(
        `Profile already exists for this user: ${request.userId}`
      );
    }

    const defaultRank = await this.rankService.findDefaultRank();
    if (!defaultRank) {
      throw new Error("System error: Default rank (min_points=0) not found.");
    }

    // chua co avartar
    const profile = new UserProfile();
    profile.userId = request.userId;
    profile.email = request.email;
    profile.username = request.username;
    profile.fullName = request.fullName;
    profile.gender = request.gender;
    profile.dateOfBirth = request.dateOfBirth;
    profile.phoneNumber = request.phoneNumber;
    profile.nationalId = request.nationalId;
    profile.address = request.address;
    profile.rank = defaultRank;
    profile.createdAt = new Date();
    profile.updatedAt = new Date();

    const saved = await this.profileRepository.save(profile);
    return this.mapToResponse(saved);
  }

  async getProfileByUserId(
    userId: string
  ): Promise<UserProfileResponse | null> {
    const profile = await this.profileRepository.findByUserId(userId);
    return profile ? this.mapToResponse(profile) : null;
  }

  async getRankAndDiscount(userId: string): Promise<RankAndDiscountResponse> {
    const profile = await this.profileRepository.findByUserId(userId);
    if (!profile) {
      throw new Error(`Không tìm thấy user profile với ID ${userId}`);
    }

    let rank: UserRank | null = profile.rank!;
    if (!rank) {
      rank = await this.rankService.findRankByLoyaltyPoint(
        profile.loyaltyPoint
      );
      if (!rank) {
        throw new Error("Không tìm thấy rank phù hợp cho user");
      }
    }

    return {
      userId,
      rankName: rank.name,
      discountRate: rank.discountRate,
    };
  }

  async updateProfile(
    userId: string,
    request: UserProfileUpdateRequest
  ): Promise<UserProfileResponse> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    if (request.fullName) existing.fullName = request.fullName;
    if (request.phoneNumber) existing.phoneNumber = request.phoneNumber;
    if (request.address) existing.address = request.address;
    if (request.avatarUrl) existing.avatarUrl = request.avatarUrl;
    if (request.gender) existing.gender = request.gender;

    existing.updatedAt = new Date();

    const saved = await this.profileRepository.save(existing);
    return this.mapToResponse(saved);
  }

  async updateLoyaltyAndRank(
    userId: string,
    request: UpdateLoyaltyRequest
  ): Promise<UserProfileResponse> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    const addedPoints = request.points;
    if (!addedPoints || addedPoints === 0) {
      return this.mapToResponse(existing);
    }

    const currentPoints = existing.loyaltyPoint ?? 0;
    const newLoyaltyPoint = currentPoints + addedPoints;
    existing.loyaltyPoint = newLoyaltyPoint;

    const description =
      request.description ??
      (addedPoints > 0 ? "Earned points from booking" : "Points adjustment");

    await this.loyaltyHistoryService.recordLoyaltyTransaction(
      userId,
      request.bookingId,
      request.bookingCode,
      addedPoints,
      request.amountSpent,
      description
    );

    const newRank =
      await this.rankService.findRankByLoyaltyPoint(newLoyaltyPoint);
    if (newRank && (!existing.rank || newRank.id !== existing.rank.id)) {
      existing.rank = newRank;
    }

    const saved = await this.profileRepository.save(existing);
    return this.mapToResponse(saved);
  }

  async deleteProfile(userId: string): Promise<void> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    // xóa ảnh
    // await deleteAvarUrl()
    // xóa profil
    await this.profileRepository.delete(existing);
  }

  async searchProfiles(keyword: string): Promise<UserProfileResponse[]> {
    let profiles: UserProfile[];
    if (!keyword || keyword.trim() === "") {
      profiles = await this.profileRepository.findTop20ByOrderByCreatedAtDesc();
    } else {
      profiles =
        await this.profileRepository.findByUsernameOrEmailOrFullNameContainingIgnoreCase(
          keyword,
          keyword,
          keyword
        );
    }
    return profiles.map((p) => this.mapToResponse(p));
  }

  async getBatchUserNames(userIds: string[]): Promise<Map<string, string>> {
    if (!userIds || userIds.length === 0) {
      return new Map();
    }

    const profiles = await this.profileRepository.findAllByUserIdIn(userIds);
    const map = new Map<string, string>();
    profiles.forEach((p) =>
      map.set(p.userId, p.fullName ? p.fullName : "Unknown")
    );
    return map;
  }

  async searchUserIdsByUsername(username: string): Promise<string[]> {
    if (!username || username.trim() === "") {
      return [];
    }

    const profiles =
      await this.profileRepository.findByUsernameOrEmailOrFullNameContainingIgnoreCase(
        username,
        username,
        username
      );
    return profiles.map((p) => p.userId);
  }

  async getUsersOptedInForPromoEmails(): Promise<PromoEmailResponse[]> {
    const profiles = await this.profileRepository.findByReceivePromoEmailTrue();
    return profiles.map((p) => ({ email: p.email }));
  }

  async updateUserPromoEmailPreference(
    userId: string,
    receivePromoEmail: boolean
  ): Promise<UserProfileResponse> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    existing.receivePromoEmail = receivePromoEmail ?? false;
    const saved = await this.profileRepository.save(existing);
    return this.mapToResponse(saved);
  }

  async updateUserStatus(
    userId: string,
    status: string
  ): Promise<UserProfileResponse> {
    const existing = await this.profileRepository.findByUserId(userId);
    if (!existing) {
      throw new Error(`Profile not found for userId: ${userId}`);
    }

    existing.status = status.toUpperCase() as any;
    const saved = await this.profileRepository.save(existing);
    return this.mapToResponse(saved);
  }

  public mapToResponse(entity: UserProfile): UserProfileResponse {
    if (!entity) throw new Error(``);

    return new UserProfileResponse(
      entity.id,
      entity.userId,
      entity.email,
      entity.username,
      entity.fullName,
      entity.avatarUrl,
      entity.gender,
      entity.dateOfBirth,
      entity.phoneNumber,
      entity.nationalId,
      entity.address,
      entity.loyaltyPoint,
      entity.rank ? entity.rank.name : null,
      entity.status,
      entity.receivePromoEmail,
      entity.createdAt,
      entity.updatedAt
    );
  }
}
