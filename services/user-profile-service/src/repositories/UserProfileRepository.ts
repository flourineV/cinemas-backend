import { DataSource, Repository, FindOptionsWhere } from "typeorm";
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
    async findByUserId(userId: string): Promise<UserProfile | null> {
        return await this.repository.findOne({ where: { userId } });
    }

    async findById(id: string): Promise<UserProfile | null> {
        return await this.repository.findOne({ where: { id } });
    }

    async update(id: string, profileData: Partial<UserProfile>): Promise<UserProfile | null> {
        await this.repository.update(id, profileData);
        return this.findById(id);
    }
    async delete(id: string): Promise<void> {
        await this.repository.delete(id);
    }
    async existsByAny(where: FindOptionsWhere<UserProfile>): Promise<boolean> {
        const count = await this.repository.count({ where });
        return count > 0;
    }

    async findAll(): Promise<UserProfile[]> {
        return await this.repository.find();
    }

}