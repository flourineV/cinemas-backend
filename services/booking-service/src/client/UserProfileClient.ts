import axios from "axios";
import type { AxiosInstance } from "axios";
import CircuitBreaker from "opossum";
import type { RankAndDiscountResponse } from "../dto/external/RankAndDiscountResponse.js";
import type { UpdateLoyaltyRequest } from "../dto/request/UpdateLoyaltyRequest.js";

export class UserProfileClient {
  private client: AxiosInstance;

  private getRankBreaker: CircuitBreaker<[string], RankAndDiscountResponse>;
  private updateLoyaltyBreaker: CircuitBreaker<
    [string, string, string, number, string],
    void
  >;
  private batchNamesBreaker: CircuitBreaker<[string[]], Record<string, string>>;
  private searchIdsBreaker: CircuitBreaker<[string], string[]>;

  constructor(baseURL: string, private internalSecret: string) {
    this.client = axios.create({ baseURL, timeout: 5000 });

    const options = { 
        timeout: 3000, 
        errorThresholdPercentage: 50, 
        resetTimeout: 10000 
    };

    this.getRankBreaker = new CircuitBreaker(this._getUserRank.bind(this), options);
    this.getRankBreaker.fallback((userId: string) => ({
      userId,
      rank: "BRONZE",
      discount: "0",
    }));

    this.updateLoyaltyBreaker = new CircuitBreaker(this._updateLoyalty.bind(this), options);
    this.updateLoyaltyBreaker.fallback((userId: string) => {
      console.error(`Circuit Breaker: Failed to update loyalty for user ${userId}`);
    });

    this.batchNamesBreaker = new CircuitBreaker(this._getBatchUserNames.bind(this), options);
    this.batchNamesBreaker.fallback((userIds: string[]) =>
      Object.fromEntries(userIds.map((id) => [id, "Unknown"]))
    );

    this.searchIdsBreaker = new CircuitBreaker(this._searchUserIds.bind(this), options);
    this.searchIdsBreaker.fallback(() => []);
  }

  // Public API
  async getUserRankAndDiscount(userId: string): Promise<RankAndDiscountResponse> {
    return this.getRankBreaker.fire(userId);
  }

  async updateLoyaltyPoints(
    userId: string,
    bookingId: string,
    bookingCode: string,
    points: number,
    amountSpent: string
  ): Promise<void> {
    return this.updateLoyaltyBreaker.fire(userId, bookingId, bookingCode, points, amountSpent);
  }

  async getBatchUserNames(userIds: string[]): Promise<Record<string, string>> {
    return this.batchNamesBreaker.fire(userIds);
  }

  async searchUserIdsByUsername(username: string): Promise<string[]> {
    return this.searchIdsBreaker.fire(username);
  }

  // Private helpers
  private async _getUserRank(userId: string): Promise<RankAndDiscountResponse> {
    const res = await this.client.get<RankAndDiscountResponse>(`/api/profiles/profiles/${userId}/rank`, {
      headers: { "x-internal-secret": this.internalSecret },
    });
    return res.data;
  }

  private async _updateLoyalty(
    userId: string,
    bookingId: string,
    bookingCode: string,
    points: number,
    amountSpent: string
  ) {
    const request: UpdateLoyaltyRequest = {
      points,
      bookingId,
      bookingCode,
      amountSpent,
      description: "Earned points from booking",
    };
    await this.client.patch(`/api/profiles/profiles/${userId}/loyalty`, request, {
      headers: { "x-internal-secret": this.internalSecret },
    });
    console.info(`Updated loyalty points for user ${userId}: +${points} points`);
  }

  private async _getBatchUserNames(userIds: string[]): Promise<Record<string, string>> {
    const res = await this.client.post<Record<string, string>>(
      `/api/profiles/profiles/batch/names`,
      userIds,
      { headers: { "x-internal-secret": this.internalSecret } }
    );
    return res.data;
  }

  private async _searchUserIds(username: string): Promise<string[]> {
    if (!username.trim()) return [];
    const res = await this.client.get<string[]>(`/api/profiles/profiles/batch/search-userids`, {
      params: { username },
      headers: { "x-internal-secret": this.internalSecret },
    });
    return res.data;
  }
}
