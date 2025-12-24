import { ManagerProfile } from "../models/ManagerProfile.entity";
import { ManagerProfileResponse } from "../dtos/response/ManagerProfileResponse";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { UserProfileService } from "./UserProfileService";
import { v4 as uuidv4 } from "uuid";

export class ManagerProfileService {
  private managerRepository: ManagerProfileRepository;
  private userProfileRepository: UserProfileRepository;
  private userProfileService: UserProfileService;

  constructor(
    managerRepository: ManagerProfileRepository,
    userProfileRepository: UserProfileRepository,
    userProfileService: UserProfileService
  ) {
    this.managerRepository = managerRepository;
    this.userProfileRepository = userProfileRepository;
    this.userProfileService = userProfileService;
  }

  async createManager(
    userProfileId: string,
    managedCinemaName: string,
    hireDate: Date
  ): Promise<ManagerProfileResponse> {
    const profile = await this.userProfileRepository.findById(userProfileId);
    if (!profile) throw new Error(`User profile not found: ${userProfileId}`);

    const exists =
      await this.managerRepository.existsByUserProfileId(userProfileId);
    if (exists) throw new Error("This user already has a manager profile.");

    const manager: ManagerProfile = {
      id: uuidv4(),
      userProfile: profile,
      managedCinemaName: managedCinemaName,
      hireDate: hireDate,
    };

    const saved = await this.managerRepository.save(manager);
    return this.toResponse(saved);
  }

  async getManagerByUserProfileId(
    userProfileId: string
  ): Promise<ManagerProfileResponse> {
    const manager =
      await this.managerRepository.findByUserProfileId(userProfileId);
    if (!manager)
      throw new Error(`Manager not found for user: ${userProfileId}`);
    return this.toResponse(manager);
  }

  async getAllManagers(): Promise<ManagerProfileResponse[]> {
    const managers = await this.managerRepository.findAll();
    return managers.map((m) => this.toResponse(m));
  }

  async getManagersByCinema(
    cinemaName: string
  ): Promise<ManagerProfileResponse[]> {
    const managers =
      await this.managerRepository.findByManagedCinemaName(cinemaName);
    return managers.map((m) => this.toResponse(m));
  }

  async deleteManager(managerId: string): Promise<void> {
    const exists =
      await this.managerRepository.existsByUserProfileId(managerId);
    if (!exists) throw new Error(`Manager not found with id: ${managerId}`);
    await this.managerRepository.deleteById(managerId);
  }

  private toResponse(manager: ManagerProfile): ManagerProfileResponse {
    return new ManagerProfileResponse(
      manager.id,
      manager.userProfile.id,
      this.userProfileService.mapToResponse(manager.userProfile),
      manager.managedCinemaName,
      manager.hireDate,
      manager.createdAt!,
      manager.updatedAt!
    );
  }
}
