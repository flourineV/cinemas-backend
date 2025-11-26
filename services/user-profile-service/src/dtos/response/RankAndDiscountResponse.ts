export class RankAndDiscountResponse {
  userId: string;
  rankName: string;
  discountRate: number;

  constructor(userId: string, rankName: string, discountRate: number) {
    this.userId = userId;
    this.rankName = rankName;
    this.discountRate = discountRate;
  }
}
