import { UserRepository } from "../repositories/UserRepository";
import { RoleRepository } from "../repositories/RoleRepository";
import { PagedResponse } from "../interfaces/PagedResponse";
import { UserListResponse } from "../dtos/response/UserListResponse";
import { User } from "../models/User.entity";

export class UserService {
  private userRepository: UserRepository;
  private roleRepository: RoleRepository;

  constructor(userRepository: UserRepository, roleRepository: RoleRepository) {
    this.userRepository = userRepository;
    this.roleRepository = roleRepository;
  }

  // lấy tất cả user
  async getUsers(
    keyword: string | null,
    status: string | null,
    role: string | null,
    page: number,
    size: number,
    sortBy: string | null,
    sortType: string | null
  ): Promise<PagedResponse<UserListResponse>> {
    const allowedSort = ["createdAt", "username", "email", "status"];
    let sortField =
      sortBy && allowedSort.includes(sortBy) ? sortBy : "createdAt";
    const sortOrder: "ASC" | "DESC" =
      sortType?.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const filter: any = {};
    if (keyword && keyword.trim() !== "") {
      filter.keyword = keyword.trim().toLowerCase();
    }
    if (status && status.trim() !== "") {
      filter.status = status.trim().toLowerCase();
    }
    if (role && role.trim() !== "") {
      filter.role = role.trim().toLowerCase();
    }

    const [users, total] =
      await this.userRepository.findAllWithPaginationAndSorting(
        filter,
        page,
        size,
        sortField,
        sortOrder
      );

    return {
      data: users.map((u: User) => UserListResponse.fromEntity(u)),
      page,
      size,
      totalElements: total,
      totalPages: Math.ceil(total / size),
    };
  }

  // lấy user bằng id
  async getUserById(id: string): Promise<UserListResponse> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");
    return UserListResponse.fromEntity(user);
  }

  // cập nhật status của user
  async updateUserStatus(id: string, newStatus: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    user.status = newStatus.toUpperCase();
    await this.userRepository.save(user);
  }

  // cập nhật role user
  async updateUserRole(id: string, newRole: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) throw new Error("User not found");

    if (user.role?.name?.toLowerCase() === "admin") {
      throw new Error("Cannot modify role of an admin user");
    }

    if (!newRole || newRole.trim() === "") {
      throw new Error("newRole is required");
    }

    const role = await this.roleRepository.findByName(
      newRole.trim().toLowerCase()
    );
    if (!role) throw new Error(`Role not found: ${newRole}`);

    user.role = role;
    await this.userRepository.save(user);
  }

  // xóa user
  async deleteUser(id: string): Promise<void> {
    const exists = await this.userRepository.existsById(id);
    if (!exists) throw new Error("User not found");
    await this.userRepository.deleteById(id);
  }
}
