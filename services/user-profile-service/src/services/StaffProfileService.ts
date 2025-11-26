import { StaffProfile } from "../models/StaffProfile.entity";
import { UserProfile } from "../models/UserProfile.entity";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ResourceNotFoundException } from "../exceptions/ResourceNotFoundException";

export class StaffProfileService {
  private staffRepository: StaffProfileRepository;
  private userProfileRepository: UserProfileRepository;

  constructor(staffRepo: StaffProfileRepository, userProfileRepo: UserProfileRepository) {
    this.staffRepository = staffRepo;
    this.userProfileRepository = userProfileRepo;
  }

  // Tạo staff profile mới
  async createStaff(userProfileId: string, cinemaId: string, startDate: Date): Promise<StaffProfile> {
    const profile = await this.userProfileRepository.findByUserId(userProfileId);
    if (!profile) {
      throw new ResourceNotFoundException(`User profile not found: ${userProfileId}`);
    }

    const exists = await this.staffRepository.existsByUserProfileId(userProfileId);
    if (exists) {
      throw new Error("This user already has a staff profile.");
    }

    const staff = new StaffProfile();
    staff.userProfile = profile;
    staff.cinemaId = cinemaId;
    staff.startDate = startDate;

    return await this.staffRepository.save(staff);
  }

  // Lấy staff theo cinemaId
  async getStaffByCinema(cinemaId: string): Promise<StaffProfile[]> {
    return await this.staffRepository.findByCinemaId(cinemaId);
  }

  // Lấy staff theo userProfileId
  async getStaffByUserProfileId(userProfileId: string): Promise<StaffProfile> {
    const staff = await this.staffRepository.findByUserProfileId(userProfileId);
    if (!staff) {
      throw new ResourceNotFoundException(`Staff not found for user: ${userProfileId}`);
    }
    return staff;
  }

  // Lấy tất cả staff
  async getAllStaff(): Promise<StaffProfile[]> {
    return await this.staffRepository.findAll();
  }

  // Xóa staff theo id
  async deleteStaff(staffId: string): Promise<void> {
    const exists = await this.staffRepository.existsById(staffId);
    if (!exists) {
      throw new ResourceNotFoundException(`Staff not found with id: ${staffId}`);
    }
    await this.staffRepository.deleteById(staffId);
  }
}
