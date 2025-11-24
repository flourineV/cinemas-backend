import { DataSource, Repository, ILike } from "typeorm";
import { UserProfile } from "../models/UserProfile.entity";

export class UserProfileRepository {
  private repository: Repository<UserProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserProfile);
  }

  // Tìm theo userId (UUID)
  async findByUserId(userId: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { userId } });
  }

  // Tìm theo email
  async findByEmail(email: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { email } });
  }

  // Tìm theo username
  async findByUsername(username: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { username } });
  }

  // Tìm theo phoneNumber
  async findByPhoneNumber(phoneNumber: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { phoneNumber } });
  }

  // Tìm theo nationalId
  async findByNationalId(nationalId: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { nationalId } });
  }

  // Exists checks
  async existsByEmail(email: string): Promise<boolean> {
    return (await this.repository.count({ where: { email } })) > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    return (await this.repository.count({ where: { username } })) > 0;
  }

  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    return (await this.repository.count({ where: { phoneNumber } })) > 0;
  }

  async existsByNationalId(nationalId: string): Promise<boolean> {
    return (await this.repository.count({ where: { nationalId } })) > 0;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    return (await this.repository.count({ where: { userId } })) > 0;
  }

  // Tìm theo email OR username OR phoneNumber
  async findByEmailOrUsernameOrPhoneNumber(identifier: string): Promise<UserProfile | null> {
    return await this.repository.findOne({
      where: [
        { email: identifier },
        { username: identifier },
        { phoneNumber: identifier },
      ],
    });
  }

  // Search theo username/email/fullName (ignore case)
  async searchByUsernameEmailOrFullName(
    username: string,
    email: string,
    fullName: string
  ): Promise<UserProfile[]> {
    return await this.repository.find({
      where: [
        { username: ILike(`%${username}%`) },
        { email: ILike(`%${email}%`) },
        { fullName: ILike(`%${fullName}%`) },
      ],
    });
  }

  // Lấy top 20 mới nhất theo createdAt
  async findTop20ByOrderByCreatedAtDesc(): Promise<UserProfile[]> {
    return await this.repository.find({
      order: { createdAt: "DESC" },
      take: 20,
    });
  }
}
