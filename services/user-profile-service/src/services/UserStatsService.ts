// import {
//   UserStatsResponse,
//   RankDistribution,
//   CinemaStaffCount,
// } from "../dtos/response/UserStatsResponse";
// import { UserProfileRepository } from "../repositories/UserProfileRepository";
// import { ManagerProfileRepository } from "../repositories/ManagerProfileRepository";
// import { StaffProfileRepository } from "../repositories/StaffProfileRepository";

// export class UserStatsService {
//   private userProfileRepository: UserProfileRepository;
//   private managerRepository: ManagerProfileRepository;
//   private staffRepository: StaffProfileRepository;

//   constructor(
//     userProfileRepo: UserProfileRepository,
//     managerRepo: ManagerProfileRepository,
//     staffRepo: StaffProfileRepository
//   ) {
//     this.userProfileRepository = userProfileRepo;
//     this.managerRepository = managerRepo;
//     this.staffRepository = staffRepo;
//   }

//   // lấy thông tin thống kê
//   async getOverviewStats(): Promise<UserStatsResponse> {
//     // --- Rank distribution ---
//     const allProfiles = await this.userProfileRepository.findAll();
//     const total = allProfiles.length;

//     const bronze = allProfiles.filter(
//       (p) => p.rank && p.rank.name.toLowerCase() === "bronze"
//     ).length;

//     const silver = allProfiles.filter(
//       (p) => p.rank && p.rank.name.toLowerCase() === "silver"
//     ).length;

//     const gold = allProfiles.filter(
//       (p) => p.rank && p.rank.name.toLowerCase() === "gold"
//     ).length;

//     const bronzePct = total > 0 ? (bronze * 100.0) / total : 0;
//     const silverPct = total > 0 ? (silver * 100.0) / total : 0;
//     const goldPct = total > 0 ? (gold * 100.0) / total : 0;

//     const rankDistribution = new RankDistribution(
//       bronze,
//       silver,
//       gold,
//       bronzePct,
//       silverPct,
//       goldPct
//     );

//     // --- Staff/Manager per cinema ---
//     const managers = await this.managerRepository.findAll();
//     const staffs = await this.staffRepository.findAll();

//     const managerCountMap: Map<string, number> = new Map();
//     managers.forEach((m) => {
//       if (m.managedCinemaId) {
//         const id = m.managedCinemaId;
//         managerCountMap.set(id, (managerCountMap.get(id) || 0) + 1);
//       }
//     });

//     const staffCountMap: Map<string, number> = new Map();
//     staffs.forEach((s) => {
//       if (s.cinemaId) {
//         const id = s.cinemaId;
//         staffCountMap.set(id, (staffCountMap.get(id) || 0) + 1);
//       }
//     });

//     const allCinemaIds = new Set<string>([
//       ...managerCountMap.keys(),
//       ...staffCountMap.keys(),
//     ]);

//     const staffCounts: CinemaStaffCount[] = Array.from(allCinemaIds).map(
//       (id) => {
//         return new CinemaStaffCount(
//           id,
//           managerCountMap.get(id) || 0,
//           staffCountMap.get(id) || 0
//         );
//       }
//     );

//     return new UserStatsResponse(rankDistribution, staffCounts);
//   }
// }
