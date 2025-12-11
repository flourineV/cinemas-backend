// src/services/StatsService.ts
import { StatsOverviewResponse } from "../dtos/response/StatsOverviewResponse";
import { UserRegistrationStatsResponse } from "../dtos/response/UserRegistrationStatsResponse";
import { UserRepository } from "../repositories/UserRepository";

export class StatsService {
  private userRepository: UserRepository;

  constructor(userRepository: UserRepository) {
    this.userRepository = userRepository;
  }

  // thống kê user theo role
  async getOverview(): Promise<StatsOverviewResponse> {
    const totalUsers: number = await this.userRepository.count();
    const totalCustomers: number =
      await this.userRepository.countByRole_NameIgnoreCase("CUSTOMER");
    const totalStaff: number =
      await this.userRepository.countByRole_NameIgnoreCase("STAFF");
    const totalManagers: number =
      await this.userRepository.countByRole_NameIgnoreCase("MANAGER");
    const totalAdmins: number =
      await this.userRepository.countByRole_NameIgnoreCase("ADMIN");

    return {
      totalUsers,
      totalCustomers,
      totalStaff,
      totalManagers,
      totalAdmins,
    };
  }

  // thống kê user đăng ký theo tháng
  async getUserRegistrationsByMonth(): Promise<
    UserRegistrationStatsResponse[]
  > {
    const results = await this.userRepository.countUserRegistrationsByMonth();

    return results.map(
      (r) =>
        new UserRegistrationStatsResponse(
          Number(r.year),
          Number(r.month),
          Number(r.total)
        )
    );
  }
}
