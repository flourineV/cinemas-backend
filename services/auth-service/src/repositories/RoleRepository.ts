import { DataSource, Repository } from "typeorm";
import { Role } from "../models/Role.entity";

// khai báo repository Role
export class RoleRepository {
  private repository: Repository<Role>;
  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(Role);
  }

  // tìm role bằng name
  async findByName(name: string): Promise<Role | null> {
    return await this.repository.findOne({ where: { name } });
  }
}
