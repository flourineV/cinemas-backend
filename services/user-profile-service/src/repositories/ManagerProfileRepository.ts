import { DataSource, Repository } from "typeorm";
import { ManagerProfile } from "../models/ManagerProfile.entity";
import { UserProfile } from "../models/UserProfile.entity";

export class ManagerProfileRepository {
  private repository: Repository<ManagerProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(ManagerProfile);
  }

  // Lưu managerProfile 
  async save(manager: ManagerProfile): Promise<ManagerProfile> {
    return await this.repository.save(manager);
  }

  // Tìm ManagerProfile theo UserProfile entity
  async findByUserProfile(userProfile: UserProfile): Promise<ManagerProfile | null> {
    return await this.repository.findOne({ where: { userProfile } });
  }

  // Tìm ManagerProfile theo userProfileId (UUID)
  async findByUserProfileId(userProfileId: string): Promise<ManagerProfile | null> {
    return await this.repository.findOne({
      where: { userProfile: { id: userProfileId } },
      relations: ["userProfile"],
    });
  }

  // Tìm tất cả ManagerProfile theo managedCinemaId
  async findByManagedCinemaId(cinemaId: string): Promise<ManagerProfile[]> {
    return await this.repository.find({ where: { managedCinemaId: cinemaId } });
  }

  // Kiểm tra tồn tại theo userProfileId
  async existsByUserProfileId(userProfileId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userProfile: { id: userProfileId } },
    });
    return count > 0;
  }

  // lấy tất cả ManagerProfile
  async findAll(): Promise<ManagerProfile[]> {
    return await this.repository.find();
  }

  // kiểm tra tồn tại theo managerId
  async existsById(managerId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: managerId },
    });
    return count > 0;
  }
  
  // Xóa ManagerProfile
  async deleteById(managerId: string): Promise<void> {
    await this.repository.delete(managerId);
  }
}
