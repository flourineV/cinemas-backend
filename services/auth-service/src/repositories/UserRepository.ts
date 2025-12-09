import { DataSource, Repository } from "typeorm";
import { User } from "../models/User.entity";

// khai báo repository User
export class UserRepository {
  private repository: Repository<User>;

  constructor(dataSource: DataSource) {
    this.repository = dataSource.getRepository(User);
  }

  // tìm user bằng id
  async findById(id: string): Promise<User | null> {
    return await this.repository.findOne({
      where: { id },
      relations: ["role"],
    });
  }

  // đếm số lượng user
  async count(): Promise<number> {
    return await this.repository.count();
  }

  // lưu user vào db
  async save(user: Partial<User>): Promise<User> {
    return await this.repository.save(user);
  }

  // check id user đã tồn tại
  async existsById(id: string): Promise<boolean> {
    return (await this.repository.count({ where: { id } })) > 0;
  }

  // xóa user bằng id
  async deleteById(id: string): Promise<void> {
    await this.repository.delete(id);
  }

  // tìm user bằng email
  async findByEmail(email: string): Promise<User | null> {
    return await this.repository.findOne({ where: { email } });
  }

  // kiểm tra email tồn tại
  async existsByEmail(email: string): Promise<boolean> {
    return (await this.repository.count({ where: { email } })) > 0;
  }

  // tìm user bằng số điện thoại
  async findByPhoneNumber(phoneNumber: string): Promise<User | null> {
    return await this.repository.findOne({ where: { phoneNumber } });
  }

  // kiểm tra tồn tại số điện thoại
  async existsByPhoneNumber(phoneNumber: string): Promise<boolean> {
    return (await this.repository.count({ where: { phoneNumber } })) > 0;
  }

  // tìm user bằng username
  async findByUsername(username: string): Promise<User | null> {
    return await this.repository.findOne({ where: { username } });
  }

  // kiểm tra tồn tại username
  async existsByUsername(username: string): Promise<boolean> {
    return (await this.repository.count({ where: { username } })) > 0;
  }

  // tìm user bằng CCCD
  async findByNationalId(nationalId: string): Promise<User | null> {
    return await this.repository.findOne({ where: { nationalId } });
  }

  // kiểm tra tồn tại CCCD
  async existsByNationalId(nationalId: string): Promise<boolean> {
    return (await this.repository.count({ where: { nationalId } })) > 0;
  }

  // tìm user bằng email hoặc username hoặc số điện thoại
  async findByEmailOrUsernameOrPhoneNumber(
    identifier: string
  ): Promise<User | null> {
    return await this.repository.findOne({
      where: [
        { email: identifier },
        { username: identifier },
        { phoneNumber: identifier },
      ],
      relations: ["role"],
    });
  }

  // điểm số lượng user bằng role
  async countByRole_NameIgnoreCase(roleName: string): Promise<number> {
    return await this.repository
      .createQueryBuilder("u")
      .leftJoin("u.role", "r")
      .where("LOWER(r.name) = LOWER(:roleName)", { roleName })
      .getCount();
  }

  // thống kế số lượng user đăng ký theo tháng và năm
  async countUserRegistrationsByMonth(): Promise<
    { year: number; month: number; total: number }[]
  > {
    return await this.repository
      .createQueryBuilder("u")
      .select("EXTRACT(YEAR FROM u.createdAt)", "year")
      .addSelect("EXTRACT(MONTH FROM u.createdAt)", "month")
      .addSelect("COUNT(u.id)", "total")
      .groupBy("year")
      .addGroupBy("month")
      .orderBy("year", "ASC")
      .addOrderBy("month", "ASC")
      .getRawMany();
  }

  // lấy danh sách user với điều kiện lọc
  async findAllWithPaginationAndSorting(
    filter: { keyword?: string; status?: string; role?: string },
    page: number,
    size: number,
    sortField: string,
    sortOrder: "ASC" | "DESC"
  ): Promise<[User[], number]> {
    const query = this.repository
      .createQueryBuilder("u")
      .leftJoinAndSelect("u.role", "role");

    if (filter.keyword) {
      const kw = `%${filter.keyword.trim().toLowerCase()}%`;
      query.andWhere(
        "(LOWER(u.username) LIKE :kw OR LOWER(u.email) LIKE :kw OR LOWER(u.phoneNumber) LIKE :kw)",
        { kw }
      );
    }

    if (filter.status) {
      query.andWhere("LOWER(u.status) = :status", {
        status: filter.status.trim().toLowerCase(),
      });
    }

    if (filter.role) {
      query.andWhere("LOWER(role.name) = :role", {
        role: filter.role.trim().toLowerCase(),
      });
    }

    // validate sortField để tránh SQL injection
    const allowedSortFields = ["username", "email", "phoneNumber", "createdAt"];
    if (!allowedSortFields.includes(sortField)) {
      sortField = "createdAt";
    }

    return await query
      .orderBy(`u.${sortField}`, sortOrder)
      .skip((page - 1) * size)
      .take(size)
      .getManyAndCount();
  }
}
