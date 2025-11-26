import { ManagerProfile } from "../models/ManagerProfile.entity";
import { UserProfile } from "../models/UserProfile.entity";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ResourceNotFoundException } from "../exceptions/ResourceNotFoundException";

export class ManagerProfileService {
  private managerRepository: ManagerProfileRepository;
  private userProfileRepository: UserProfileRepository;

  constructor(managerRepo: ManagerProfileRepository, userProfileRepo: UserProfileRepository) {
    this.managerRepository = managerRepo;
    this.userProfileRepository = userProfileRepo;
  }

  // Tạo manager profile mới
  async createManager(userProfileId: string, managedCinemaId: string, hireDate: Date): Promise<ManagerProfile> {
    const profile = await this.userProfileRepository.findByUserId(userProfileId);
    if (!profile) {
      throw new ResourceNotFoundException(`User profile not found: ${userProfileId}`);
    }

    const exists = await this.managerRepository.existsByUserProfileId(userProfileId);
    if (exists) {
      throw new Error("This user already has a manager profile.");
    }

    const manager = new ManagerProfile();
    manager.userProfile = profile;
    manager.managedCinemaId = managedCinemaId;
    manager.hireDate = hireDate;

    return await this.managerRepository.save(manager);
  }

  // Lấy manager theo userProfileId
  async getManagerByUserProfileId(userProfileId: string): Promise<ManagerProfile> {
    const manager = await this.managerRepository.findByUserProfileId(userProfileId);
    if (!manager) {
      throw new ResourceNotFoundException(`Manager not found for user: ${userProfileId}`);
    }
    return manager;
  }

  // Lấy tất cả managers
  async getAllManagers(): Promise<ManagerProfile[]> {
    return await this.managerRepository.findAll();
  }

  // Lấy managers theo cinemaId
  async getManagersByCinema(cinemaId: string): Promise<ManagerProfile[]> {
    return await this.managerRepository.findByManagedCinemaId(cinemaId);
  }

  // Xóa manager theo id
  async deleteManager(managerId: string): Promise<void> {
    const exists = await this.managerRepository.existsById(managerId);
    if (!exists) {
      throw new ResourceNotFoundException(`Manager not found with id: ${managerId}`);
    }
    await this.managerRepository.deleteById(managerId);
  }
}
