import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
import { StaffProfileRepository } from "../repositories/StaffProfileRepository";
import { UserFavoriteMovieRepository } from "../repositories/UserFavoriteMovieRepository";
import { BookingClient } from "../client/BookingClient";
import { UserStatsResponse } from "../dtos/response/UserStatsResponse";
import { UserPersonalStatsResponse } from "../dtos/response/UserPersonalStatsResponse";
import { UserProfile } from "../models/UserProfile.entity";

export class UserStatsService {
  private userProfileRepository: UserProfileRepository;
  private managerRepository: ManagerProfileRepository;
  private staffRepository: StaffProfileRepository;
  private favoriteMovieRepository: UserFavoriteMovieRepository;
  private bookingClient: BookingClient;

  constructor(
    userProfileRepository: UserProfileRepository,
    managerRepository: ManagerProfileRepository,
    staffRepository: StaffProfileRepository,
    favoriteMovieRepository: UserFavoriteMovieRepository,
    bookingClient: BookingClient
  ) {
    this.userProfileRepository = userProfileRepository;
    this.managerRepository = managerRepository;
    this.staffRepository = staffRepository;
    this.favoriteMovieRepository = favoriteMovieRepository;
    this.bookingClient = bookingClient;
  }

  async getOverviewStats(): Promise<UserStatsResponse> {
    // --- Rank distribution ---
    const allProfiles: UserProfile[] =
      await this.userProfileRepository.findAll();
    const total = allProfiles.length;

    const bronze = allProfiles.filter(
      (p) => p.rank && p.rank.name.toLowerCase() === "bronze"
    ).length;

    const silver = allProfiles.filter(
      (p) => p.rank && p.rank.name.toLowerCase() === "silver"
    ).length;

    const gold = allProfiles.filter(
      (p) => p.rank && p.rank.name.toLowerCase() === "gold"
    ).length;

    const bronzePct = total > 0 ? (bronze * 100.0) / total : 0;
    const silverPct = total > 0 ? (silver * 100.0) / total : 0;
    const goldPct = total > 0 ? (gold * 100.0) / total : 0;

    const rankDistribution: UserStatsResponse["rankDistribution"] = {
      bronzeCount: bronze,
      silverCount: silver,
      goldCount: gold,
      bronzePercentage: bronzePct,
      silverPercentage: silverPct,
      goldPercentage: goldPct,
    };

    // --- Staff/Manager per cinema ---
    const managers = await this.managerRepository.findAll();
    const managerCountMap: Record<string, number> = {};
    managers
      .filter((m) => m.managedCinemaName)
      .forEach((m) => {
        managerCountMap[m.managedCinemaName] =
          (managerCountMap[m.managedCinemaName] || 0) + 1;
      });

    const staff = await this.staffRepository.findAll();
    const staffCountMap: Record<string, number> = {};
    staff
      .filter((s) => s.cinemaName)
      .forEach((s) => {
        staffCountMap[s.cinemaName] = (staffCountMap[s.cinemaName] || 0) + 1;
      });

    const allCinemaNames = new Set([
      ...Object.keys(managerCountMap),
      ...Object.keys(staffCountMap),
    ]);

    return { rankDistribution };
  }

  async getUserPersonalStats(
    userId: string
  ): Promise<UserPersonalStatsResponse> {
    const profile = await this.userProfileRepository.findByUserId(userId);
    if (!profile) throw new Error("User profile not found");

    const favoriteMoviesCount =
      await this.favoriteMovieRepository.countByUserId(userId);
    const bookingsCount =
      await this.bookingClient.getBookingCountByUserId(userId);

    return {
      totalBookings: bookingsCount,
      totalFavoriteMovies: favoriteMoviesCount,
      loyaltyPoints: profile.loyaltyPoint,
    };
  }
}
