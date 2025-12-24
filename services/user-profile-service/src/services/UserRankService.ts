import { RankRequest } from "../dtos/request/RankRequest";
import { RankResponse } from "../dtos/response/RankResponse";
import { UserRank } from "../models/UserRank.entity";
import { UserRankRepository } from "../repositories/UserRankRepository";
import { ResourceNotFoundException } from "../exceptions/ResourceNotFoundException";

export class UserRankService {
  private rankRepository: UserRankRepository;

  constructor(rankRepo: UserRankRepository) {
    this.rankRepository = rankRepo;
  }

  async createRank(request: RankRequest): Promise<RankResponse> {
    // Logic nghiệp vụ: minPoints < maxPoints
    if (
      request.maxPoints !== undefined &&
      request.minPoints >= request.maxPoints
    ) {
      throw new Error("Minimum points must be less than maximum points.");
    }
    const rank = new UserRank();
    rank.name = request.name;
    rank.minPoints = request.minPoints;
    rank.maxPoints = request.maxPoints;
    rank.discountRate = request.discountRate;
    const saved = await this.rankRepository.save(rank);
    return this.mapToResponse(saved);
  }

  // Cập nhật Rank
  async updateRank(
    rankId: string,
    request: RankRequest
  ): Promise<RankResponse> {
    const existingRank = await this.rankRepository.findById(rankId);
    if (!existingRank) {
      throw new Error(`Rank not found with id: ${rankId}`);
    }
    if (request.name !== undefined) {
      existingRank.name = request.name;
    }
    if (request.minPoints !== undefined) {
      existingRank.minPoints = request.minPoints;
    }
    if (request.maxPoints !== undefined) {
      existingRank.maxPoints = request.maxPoints;
    }
    if (request.discountRate !== undefined) {
      existingRank.discountRate = request.discountRate;
    } // Kiểm tra lại ràng buộc
    if (
      existingRank.maxPoints !== undefined &&
      existingRank.minPoints >= existingRank.maxPoints
    ) {
      throw new Error(
        "Cập nhật thất bại: Minimum points phải nhỏ hơn maximum points."
      );
    }
    const saved = await this.rankRepository.save(existingRank);
    return this.mapToResponse(saved);
  }

  // Lấy tất cả Rank
  async getAllRanks(): Promise<RankResponse[]> {
    const ranks = await this.rankRepository.findAll();
    return ranks.map((r) => this.mapToResponse(r));
  }

  // Lấy Rank theo id
  async getRankById(rankId: string): Promise<RankResponse> {
    const rank = await this.rankRepository.findById(rankId);
    if (!rank) {
      throw new Error(`Rank not found with id: ${rankId}`);
    }
    return this.mapToResponse(rank);
  }

  // Xóa Rank
  async deleteRank(rankId: string): Promise<void> {
    const existingRank = await this.rankRepository.findById(rankId);
    if (!existingRank) {
      throw new Error(`Rank not found with id: ${rankId}`);
    }
    await this.rankRepository.deleteById(rankId);
  }

  // Tìm default rank (minPoints = 0)
  async findDefaultRank(): Promise<UserRank | null> {
    return this.rankRepository.findByMinPoints(0);
  }

  // Tìm rank phù hợp với loyalty points
  async findRankByLoyaltyPoint(points: number): Promise<UserRank | null> {
    return this.rankRepository.findBestRankByPoints(points);
  }

  private mapToResponse(entity: UserRank): RankResponse {
    return new RankResponse(
      entity.id,
      entity.name,
      entity.minPoints,
      entity.maxPoints,
      Number(entity.discountRate),
      entity.createdAt,
      entity.updatedAt
    );
  }
}
