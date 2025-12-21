import { StaffProfile } from "../models/StaffProfile.entity";
import { StaffProfileResponse } from "../dtos/response/StaffProfileResponse";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { UserProfileService } from "./UserProfileService";
import { v4 as uuidv4 } from "uuid";
export class StaffProfileService {
  private staffRepository: StaffProfileRepository;
  private userProfileRepository: UserProfileRepository;
  private managerRepository: ManagerProfileRepository;
  private userProfileService: UserProfileService;

  constructor(
    staffRepository: StaffProfileRepository,
    userProfileRepository: UserProfileRepository,
    managerRepository: ManagerProfileRepository,
    userProfileService: UserProfileService
  ) {
    this.staffRepository = staffRepository;
    this.userProfileRepository = userProfileRepository;
    this.managerRepository = managerRepository;
    this.userProfileService = userProfileService;
  }

  async createStaff(
    userProfileId: string,
    cinemaName: string,
    hireDate: Date
  ): Promise<StaffProfileResponse> {
    const profile = await this.userProfileRepository.findById(userProfileId);
    if (!profile) throw new Error(`User profile not found: ${userProfileId}`);

    const exists =
      await this.staffRepository.existsByUserProfileId(userProfileId);
    if (exists) throw new Error("This user already has a staff profile.");

    const staff: StaffProfile = {
      id: uuidv4(),
      userProfile: profile,
      cinemaName: cinemaName,
      hireDate: hireDate,
    };

    const saved = await this.staffRepository.save(staff);
    return this.toResponse(saved);
  }

  async getStaffByCinema(
    cinemaName: string,
    currentUserId: string,
    userRole: string
  ): Promise<StaffProfileResponse[]> {
    if (userRole.toUpperCase() === "ADMIN") {
      const staffList = await this.staffRepository.findByCinemaName(cinemaName);
      return staffList.map((s) => this.toResponse(s));
    }

    if (userRole.toUpperCase() === "MANAGER") {
      const manager =
        await this.managerRepository.findByUserProfileId(currentUserId);
      if (!manager) throw new Error("Manager profile not found");

      if (manager.managedCinemaName !== cinemaName) {
        throw new Error("You can only view staff from your managed cinema");
      }

      const staffList = await this.staffRepository.findByCinemaName(cinemaName);
      return staffList.map((s) => this.toResponse(s));
    }

    throw new Error("Insufficient permissions");
  }

  async getStaffByUserProfileId(
    userProfileId: string
  ): Promise<StaffProfileResponse> {
    const staff = await this.staffRepository.findByUserProfileId(userProfileId);
    if (!staff) throw new Error(`Staff not found for user: ${userProfileId}`);
    return this.toResponse(staff);
  }

  async getAllStaff(
    currentUserId: string,
    userRole: string
  ): Promise<StaffProfileResponse[]> {
    if (userRole.toUpperCase() === "ADMIN") {
      const staffList = await this.staffRepository.findAll();
      return staffList.map((s) => this.toResponse(s));
    }

    if (userRole.toUpperCase() === "MANAGER") {
      const manager =
        await this.managerRepository.findByUserProfileId(currentUserId);
      if (!manager) throw new Error("Manager profile not found");

      const staffList = await this.staffRepository.findByCinemaName(
        manager.managedCinemaName
      );
      return staffList.map((s) => this.toResponse(s));
    }

    throw new Error("Insufficient permissions");
  }

  async deleteStaff(staffId: string): Promise<void> {
    const exists = await this.staffRepository.existsByUserProfileId(staffId);
    if (!exists) throw new Error(`Staff not found with id: ${staffId}`);
    await this.staffRepository.deleteById(staffId);
  }

  private toResponse(staff: StaffProfile): StaffProfileResponse {
    return new StaffProfileResponse(
      staff.id,
      staff.userProfile.id,
      this.userProfileService.mapToResponse(staff.userProfile),
      staff.cinemaName,
      staff.hireDate,
      staff.createdAt!,
      staff.updatedAt!
    );
  }
}
