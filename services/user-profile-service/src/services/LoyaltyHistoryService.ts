import { LoyaltyHistoryRepository } from "../repositories/LoyaltyHistoryRepository";
import { UserProfileRepository } from "../repositories/UserProfileRepository";
import { LoyaltyHistory } from "../models/LoyaltyHistory.entity";
import { UserProfile } from "../models/UserProfile.entity";
import { LoyaltyHistoryResponse } from "../dtos/response/LoyaltyHistoryResponse";
import { PagedLoyaltyHistoryResponse } from "../dtos/response/PagedLoyaltyHistoryResponse";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
dayjs.extend(utc);
dayjs.extend(timezone);

export class LoyaltyHistoryService {
  private loyaltyHistoryRepository: LoyaltyHistoryRepository;
  private userProfileRepository: UserProfileRepository;
  constructor(
    loyaltyHistoryRepository: LoyaltyHistoryRepository,
    userProfileRepository: UserProfileRepository
  ) {
    this.loyaltyHistoryRepository = loyaltyHistoryRepository;
    this.userProfileRepository = userProfileRepository;
  }

  async recordLoyaltyTransaction(
    userId: string,
    bookingId: string,
    bookingCode: string,
    pointsChange: number,
    amountSpent: string,
    description: string
  ): Promise<void> {
    const user = await this.userProfileRepository.findByUserId(userId);
    if (!user) {
      throw new Error("User profile not found");
    }

    const pointsBefore = user.loyaltyPoint;
    const pointsAfter = pointsBefore + pointsChange;

    const history = new LoyaltyHistory();
    history.user = user;
    history.bookingId = bookingId;
    history.bookingCode = bookingCode;
    history.pointsChange = pointsChange;
    history.pointsBefore = pointsBefore;
    history.pointsAfter = pointsAfter;
    history.amountSpent = amountSpent;
    history.description = description;

    await this.loyaltyHistoryRepository.save(history);

    console.info(
      `Recorded loyalty transaction for user ${userId}: ${pointsChange} points (${description})`
    );
  }

  async getUserLoyaltyHistory(
    userId: string,
    page: number,
    size: number
  ): Promise<PagedLoyaltyHistoryResponse> {
    const skip = (page - 1) * size;
    const take = size;

    // giờ repo trả về [histories, totalElements]
    const [histories, totalElements] =
      await this.loyaltyHistoryRepository.findByUserIdOrderByCreatedAtDesc(
        userId,
        skip,
        take
      );

    const content: LoyaltyHistoryResponse[] = histories.map((h) =>
      this.mapToResponse(h)
    );

    const totalPages = Math.ceil(totalElements / size);

    return {
      data: content,
      page,
      size,
      totalElements,
      totalPages,
    };
  }

  private mapToResponse(history: LoyaltyHistory): LoyaltyHistoryResponse {
    return new LoyaltyHistoryResponse(
      history.id,
      history.bookingId,
      history.pointsChange,
      history.pointsBefore,
      history.pointsAfter,
      history.amountSpent,
      history.description,
      history.createdAt
    );
  }
}
