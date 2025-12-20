import { DataSource, Repository } from "typeorm";
import { ManagerProfile } from "../models/ManagerProfile.entity";
import { UserProfile } from "../models/UserProfile.entity";

export class ManagerProfileRepository {
  private repository: Repository<ManagerProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(ManagerProfile);
  }

  // Tìm ManagerProfile theo UserProfile entity
  async findByUserProfile(
    userProfile: UserProfile
  ): Promise<ManagerProfile | null> {
    return this.repository.findOne({ where: { userProfile } });
  }

  // Tìm ManagerProfile theo userProfileId
  async findByUserProfileId(
    userProfileId: string
  ): Promise<ManagerProfile | null> {
    return this.repository.findOne({
      where: { userProfile: { id: userProfileId } },
      relations: ["userProfile"],
    });
  }

  // Tìm danh sách ManagerProfile theo managedCinemaName
  async findByManagedCinemaName(cinemaName: string): Promise<ManagerProfile[]> {
    return this.repository.find({ where: { managedCinemaName: cinemaName } });
  }

  // Kiểm tra tồn tại theo userProfileId
  async existsByUserProfileId(userProfileId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userProfile: { id: userProfileId } },
    });
    return count > 0;
  }

  // Các hàm bổ sung thường dùng
  async findAll(): Promise<ManagerProfile[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<ManagerProfile | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(profile: ManagerProfile): Promise<ManagerProfile> {
    return this.repository.save(profile);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
