import { DataSource, Repository } from "typeorm";
import { StaffProfile } from "../models/StaffProfile.entity";
import { UserProfile } from "../models/UserProfile.entity";

export class StaffProfileRepository {
  private repository: Repository<StaffProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(StaffProfile);
  }

  // Lưu staff 
  async save(staff: StaffProfile): Promise<StaffProfile> {
    return await this.repository.save(staff);
  }

  // Lấy tất cả staff 
  async findAll(): Promise<StaffProfile[]> {
    return await this.repository.find();
  }


  // Tìm StaffProfile theo UserProfile entity
  async findByUserProfile(userProfile: UserProfile): Promise<StaffProfile | null> {
    return await this.repository.findOne({ where: { userProfile } });
  }

  // Tìm StaffProfile theo userProfileId (UUID)
  async findByUserProfileId(userProfileId: string): Promise<StaffProfile | null> {
    return await this.repository.findOne({
      where: { userProfile: { id: userProfileId } },
      relations: ["userProfile"],
    });
  }

  // kiểm tra tồn tại theo staffId
  async existsById(staffId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: staffId },
    });
    return count > 0;
  }

  // Kiểm tra tồn tại theo userProfileId
  async existsByUserProfileId(userProfileId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userProfile: { id: userProfileId } },
    });
    return count > 0;
  }

  // Tìm tất cả StaffProfile theo cinemaId
  async findByCinemaId(cinemaId: string): Promise<StaffProfile[]> {
    return await this.repository.find({ where: { cinemaId } });
  }

  // xóa staff by id 
  async deleteById(staffId: string): Promise<void> {
    await this.repository.delete(staffId);
  }

}
