import { DataSource, Repository } from "typeorm";
import { StaffProfile } from "../models/StaffProfile.entity";

export class StaffProfileRepository {
  private repository: Repository<StaffProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(StaffProfile);
  }

  // Tìm StaffProfile theo UserProfile entity
  async findByUserProfile(userProfile: any): Promise<StaffProfile | null> {
    return this.repository.findOne({ where: { userProfile } });
  }

  // Tìm StaffProfile theo userProfileId
  async findByUserProfileId(
    userProfileId: string
  ): Promise<StaffProfile | null> {
    return this.repository.findOne({
      where: { userProfile: { id: userProfileId } },
      relations: ["userProfile"],
    });
  }

  // Kiểm tra tồn tại theo userProfileId
  async existsByUserProfileId(userProfileId: string): Promise<boolean> {
    const count = await this.repository.count({
      where: { userProfile: { id: userProfileId } },
    });
    return count > 0;
  }

  // Tìm danh sách StaffProfile theo cinemaName
  async findByCinemaName(cinemaName: string): Promise<StaffProfile[]> {
    return this.repository.find({ where: { cinemaName } });
  }

  async findAll(): Promise<StaffProfile[]> {
    return this.repository.find();
  }

  async findById(id: string): Promise<StaffProfile | null> {
    return this.repository.findOne({ where: { id } });
  }

  async save(profile: StaffProfile): Promise<StaffProfile> {
    return this.repository.save(profile);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
