import { DataSource, Repository, ILike } from "typeorm";
import { UserProfile } from "../models/UserProfile.entity";

export class UserProfileRepository {
  private repository: Repository<UserProfile>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(UserProfile);
  }

  async create(profileData: Partial<UserProfile>): Promise<UserProfile> {
    const profile = this.repository.create(profileData);
    return await this.repository.save(profile);
  }

  async findById(id: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByUserId(userId: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { userId } });
  }

  async findByEmail(email: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findByUsername(username: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { username } });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { phoneNumber } });
  }

  async findByNationalId(nationalId: string): Promise<UserProfile | null> {
    return await this.repository.findOne({ where: { nationalId } });
  }

  async findByEmailOrUsernameOrPhoneNumber(identifier: string): Promise<UserProfile | null> {
    return await this.repository.findOne({
      where: [
        { email: identifier },
        { username: identifier },
        { phoneNumber: identifier },
      ],
    });
  }

  async findByStatus(status: string): Promise<UserProfile[]> {
    return await this.repository.find({ where: { status } });
  }

  async findByRank(rank: string): Promise<UserProfile[]> {
    return await this.repository.find({ where: { rank } });
  }

  async findByFullNameContaining(name: string): Promise<UserProfile[]> {
    return await this.repository.find({
      where: { fullName: ILike(`%${name}%`) },
    });
  }

  async findByGender(gender: string): Promise<UserProfile[]> {
    return await this.repository.find({ where: { gender } });
  }

  async findByFavoriteGenresContaining(genre: string): Promise<UserProfile[]> {
    return await this.repository
      .createQueryBuilder("profile")
      .where("profile.favoriteGenres::text ILIKE :genre", {
        genre: `%${genre}%`,
      })
      .getMany();
  }

  async findByLoyaltyPointGreaterThanEqual(minPoints: number): Promise<UserProfile[]> {
    return await this.repository.find({
      where: { loyaltyPoint: minPoints },
    });
  }

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

  async update(id: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
    await this.repository.update(id, profileData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async findAll(): Promise<UserProfile[]> {
    return await this.repository.find();
  }
}
