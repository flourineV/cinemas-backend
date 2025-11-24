import { DataSource, Repository } from "typeorm";
import { ManagerProfile } from "../models/ManagerProfile.entity";
import { UserProfile } from "../models/UserProfile.entity";

export class ManagerProfileRepository {
  private repository: Repository<ManagerProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(ManagerProfile);
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
}
