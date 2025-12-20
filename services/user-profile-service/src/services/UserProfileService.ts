// import { UserProfileRequest } from "../dtos/request/UserProfileRequest";
// import { UserProfileUpdateRequest } from "../dtos/request/UserProfileUpdateRequest";
// import { RankAndDiscountResponse } from "../dtos/response/RankAndDiscountResponse";
// import { UserProfileResponse } from "../dtos/response/UserProfileResponse";
// import { UserProfile } from "../models/UserProfile.entity";
// import { UserRank } from "../models/UserRank.entity";
// import { ResourceNotFoundException } from "../exceptions/ResourceNotFoundException";
// import { UserProfileRepository } from "../repositories/UserProfileRepository";
// import { UserRankService } from "./UserRankService";
// import { CloudinaryService } from "./CloudinaryService";

// export class UserProfileService {
//   private profileRepository: UserProfileRepository;
//   private rankService: UserRankService;
//   private cloudinaryService: CloudinaryService;
//   constructor(
//     profileRepository: UserProfileRepository,
//     rankService: UserRankService,
//     cloudinaryService: CloudinaryService
//   ) {
//     this.profileRepository = profileRepository;
//     this.rankService = rankService;
//     this.cloudinaryService = cloudinaryService;
//   }

//   async createProfile(
//     request: UserProfileRequest
//   ): Promise<UserProfileResponse> {
//     const exists = await this.profileRepository.existsByUserId(request.userId);
//     if (exists) {
//       throw new Error(`Profile already exists for user: ${request.userId}`);
//     }

//     const defaultRank = await this.rankService.findDefaultRank();
//     if (!defaultRank) {
//       throw new Error(
//         "Hệ thống lỗi: Không tìm thấy Rank mặc định (min_points=0)."
//       );
//     }

//     // Lấy avatar mặc định từ public_id đã setup sẵn
//     const avatarUrl = this.cloudinaryService.getPublicUrl(
//       "cinemas_avatar/default_avt"
//     );

//     const profile = new UserProfile();
//     profile.userId = request.userId;
//     profile.email = request.email;
//     profile.username = request.username;
//     profile.fullName = request.fullName;
//     profile.avatarUrl = avatarUrl;
//     profile.gender = request.gender;
//     profile.dateOfBirth = request.dateOfBirth;
//     profile.phoneNumber = request.phoneNumber;
//     profile.nationalId = request.nationalId;
//     profile.address = request.address;
//     profile.rank = defaultRank;
//     profile.createdAt = new Date();
//     profile.updatedAt = new Date();

//     const saved = await this.profileRepository.save(profile);
//     return this.mapToResponse(saved);
//   }

//   async getProfileByUserId(
//     userId: string
//   ): Promise<UserProfileResponse | null> {
//     const profile = await this.profileRepository.findByUserId(userId);
//     return profile ? this.mapToResponse(profile) : null;
//   }

//   async getRankAndDiscount(userId: string): Promise<RankAndDiscountResponse> {
//     const profile = await this.profileRepository.findByUserId(userId);
//     if (!profile) {
//       throw new ResourceNotFoundException(
//         `Không tìm thấy user profile với ID ${userId}`
//       );
//     }

//     let rank: UserRank | null = profile.rank;
//     if (!rank) {
//       rank = await this.rankService.findRankByLoyaltyPoint(
//         profile.loyaltyPoint
//       );
//       if (!rank) {
//         throw new ResourceNotFoundException(
//           "Không tìm thấy rank phù hợp cho user"
//         );
//       }
//     }

//     return {
//       userId,
//       rankName: rank.name,
//       discountRate: rank.discountRate,
//     };
//   }

//   async updateProfile(
//     userId: string,
//     request: UserProfileUpdateRequest
//   ): Promise<UserProfileResponse> {
//     const existing = await this.profileRepository.findByUserId(userId);
//     if (!existing) {
//       throw new ResourceNotFoundException(
//         `Profile not found for userId: ${userId}`
//       );
//     }

//     if (request.fullName) existing.fullName = request.fullName;
//     if (request.phoneNumber) existing.phoneNumber = request.phoneNumber;
//     if (request.address) existing.address = request.address;
//     if (request.avatarUrl) existing.avatarUrl = request.avatarUrl;
//     if (request.gender) existing.gender = request.gender;

//     existing.updatedAt = new Date();

//     const saved = await this.profileRepository.save(existing);
//     return this.mapToResponse(saved);
//   }

//   async updateLoyaltyAndRank(
//     userId: string,
//     addedPoints: number
//   ): Promise<UserProfileResponse> {
//     const existing = await this.profileRepository.findByUserId(userId);
//     if (!existing) {
//       throw new ResourceNotFoundException(
//         `Profile not found for userId: ${userId}`
//       );
//     }

//     if (!addedPoints || addedPoints <= 0) {
//       return this.mapToResponse(existing);
//     }

//     const currentPoints = existing.loyaltyPoint ?? 0;
//     const newLoyaltyPoint = currentPoints + addedPoints;
//     existing.loyaltyPoint = newLoyaltyPoint;

//     const newRank =
//       await this.rankService.findRankByLoyaltyPoint(newLoyaltyPoint);
//     if (newRank && (!existing.rank || newRank.id !== existing.rank.id)) {
//       existing.rank = newRank;
//     }

//     const saved = await this.profileRepository.save(existing);
//     return this.mapToResponse(saved);
//   }

//   async deleteProfile(userId: string): Promise<void> {
//     const existing = await this.profileRepository.findByUserId(userId);
//     if (!existing) {
//       throw new ResourceNotFoundException(
//         `Profile not found for userId: ${userId}`
//       );
//     }

//     if (existing.avatarUrl) {
//       await this.cloudinaryService.deleteFileByUrl(existing.avatarUrl);
//     }

//     await this.profileRepository.delete(existing);
//   }

//   async searchProfiles(keyword: string): Promise<UserProfileResponse[]> {
//     if (!keyword || keyword.trim() === "") {
//       const profiles =
//         await this.profileRepository.findTop20ByOrderByCreatedAtDesc();
//       return profiles.map(this.mapToResponse);
//     }

//     const profiles =
//       await this.profileRepository.searchByUsernameEmailOrFullName(
//         keyword,
//         keyword,
//         keyword
//       );
//     return profiles.map(this.mapToResponse);
//   }

//   private mapToResponse(entity: UserProfile): UserProfileResponse {
//     if (!entity)
//       throw new ResourceNotFoundException("User profile entity is null");

//     const rank: UserRank = entity.rank;

//     return {
//       id: entity.id,
//       userId: entity.userId,
//       email: entity.email,
//       username: entity.username,
//       fullName: entity.fullName,
//       avatarUrl: entity.avatarUrl,
//       gender: entity.gender,
//       dateOfBirth: entity.dateOfBirth,
//       phoneNumber: entity.phoneNumber,
//       nationalId: entity.nationalId,
//       address: entity.address,
//       loyaltyPoint: entity.loyaltyPoint,
//       rankName: rank.name,
//       status: entity.status,
//       createdAt: entity.createdAt,
//       updatedAt: entity.updatedAt,
//     };
//   }
// }
