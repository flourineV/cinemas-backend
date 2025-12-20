import { DataSource, Repository, In } from "typeorm";
import { UserProfile } from "../models/UserProfile.entity";

export class UserProfileRepository {
  private repository: Repository<UserProfile>;

  constructor(private dataSource: DataSource) {
    this.repository = this.dataSource.getRepository(UserProfile);
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { userId } });
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { username } });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { phoneNumber } });
  }

  async findByNationalId(nationalId: string): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { nationalId } });
  }

  async existsByEmail(email: string): Promise<boolean> {
    const count = await this.repository.count({ where: { email } });
    return count > 0;
  }

  async existsByUsername(username: string): Promise<boolean> {
    const count = await this.repository.count({ where: { username } });
    return count > 0;
  }

  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    const count = await this.repository.count({ where: { phoneNumber } });
    return count > 0;
  }

  async existsByNationalId(nationalId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { nationalId } });
    return count > 0;
  }

  async existsByUserId(userId: string): Promise<boolean> {
    const count = await this.repository.count({ where: { userId } });
    return count > 0;
  }

  async findByReceivePromoEmailTrue(): Promise<UserProfile[]> {
    return this.repository.find({ where: { receivePromoEmail: true } });
  }

  async findByEmailOrUsernameOrPhoneNumber(
    identifier: string
  ): Promise<UserProfile | null> {
    return this.repository.findOne({
      where: [
        { email: identifier },
        { username: identifier },
        { phoneNumber: identifier },
      ],
    });
  }

  async findByUsernameOrEmailOrFullNameContainingIgnoreCase(
    username: string,
    email: string,
    fullName: string
  ): Promise<UserProfile[]> {
    return this.repository
      .createQueryBuilder("p")
      .where("LOWER(p.username) LIKE LOWER(:username)", {
        username: `%${username}%`,
      })
      .orWhere("LOWER(p.email) LIKE LOWER(:email)", { email: `%${email}%` })
      .orWhere("LOWER(p.fullName) LIKE LOWER(:fullName)", {
        fullName: `%${fullName}%`,
      })
      .getMany();
  }

  async findTop20ByOrderByCreatedAtDesc(): Promise<UserProfile[]> {
    return this.repository.find({
      order: { createdAt: "DESC" },
      take: 20,
    });
  }

  async findAllByUserIdIn(userIds: string[]): Promise<UserProfile[]> {
    return this.repository.find({
      where: { userId: In(userIds) },
    });
  }

  async findById(id: string): Promise<UserProfile | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findAll(): Promise<UserProfile[]> {
    return this.repository.find();
  }

  async save(profile: UserProfile): Promise<UserProfile> {
    return this.repository.save(profile);
  }

  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }
}
