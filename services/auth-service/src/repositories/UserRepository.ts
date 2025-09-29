import { DataSource, Repository, FindOptionsWhere } from "typeorm";
import { User } from "../models/User.entity";

export class UserRepository {
  private repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.repository.create(userData);
    return await this.repository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({ where: { id } });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne({ where: { username } });
  }

  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.repository.findOne({ where: { phoneNumber } });
  }

  async update(id: string, userData: Partial<User>): Promise<User | null> {
    await this.repository.update(id, userData);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  async existsByAny(where: FindOptionsWhere<User>): Promise<boolean> {
    const count = await this.repository.count({ where });
    return count > 0;
  }

  async validateCredentials(
    identifier: string,
    passwordHash: string
  ): Promise<User | null> {
    return await this.repository.findOne({
      where: [
        { email: identifier, passwordHash },
        { username: identifier, passwordHash },
        { phoneNumber: identifier, passwordHash },
      ],
    });
  }
}
