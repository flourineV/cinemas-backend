export class UserStatsResponse {
  rankDistribution: RankDistribution;

  constructor(rankDistribution: RankDistribution) {
    this.rankDistribution = rankDistribution;
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
