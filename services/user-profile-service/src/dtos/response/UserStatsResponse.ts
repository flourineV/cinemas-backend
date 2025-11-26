export class UserStatsResponse {
  rankDistribution: RankDistribution;
  staffCounts: CinemaStaffCount[];

  constructor(
    rankDistribution: RankDistribution,
    staffCounts: CinemaStaffCount[]
  ) {
    this.rankDistribution = rankDistribution;
    this.staffCounts = staffCounts;
  }
}

export class RankDistribution {
  bronzeCount: number;
  silverCount: number;
  goldCount: number;

  bronzePercentage: number;
  silverPercentage: number;
  goldPercentage: number;

  constructor(
    bronzeCount: number,
    silverCount: number,
    goldCount: number,
    bronzePercentage: number,
    silverPercentage: number,
    goldPercentage: number
  ) {
    this.bronzeCount = bronzeCount;
    this.silverCount = silverCount;
    this.goldCount = goldCount;
    this.bronzePercentage = bronzePercentage;
    this.silverPercentage = silverPercentage;
    this.goldPercentage = goldPercentage;
  }
}

export class CinemaStaffCount {
  cinemaId: string;
  managerCount: number;
  staffCount: number;

  constructor(cinemaId: string, managerCount: number, staffCount: number) {
    this.cinemaId = cinemaId;
    this.managerCount = managerCount;
    this.staffCount = staffCount;
  }
}
