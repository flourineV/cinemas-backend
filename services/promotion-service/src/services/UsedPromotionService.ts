import { UsedPromotionRepository } from "../repositories/UsedPromotionRepository";
import { PromotionRepository } from "../repositories/PromotionRepository";
import { RecordPromotionUsageRequest } from "../dtos/request/RecordPromotionUsageRequest";
import { UpdatePromotionUsageStatusRequest } from "../dtos/request/UpdatePromotionUsageStatusRequest";
import { UsedPromotionResponse } from "../dtos/response/UsedPromotionResponse";
import { Promotion } from "../models/Promotion.entity";
import { UsedPromotion, BookingStatus } from "../models/UsedPromotion.entity";

export class UsedPromotionService {
  private usedPromotionRepository: UsedPromotionRepository;
  private promotionRepository: PromotionRepository;

  constructor(
    usedPromotionRepository: UsedPromotionRepository,
    promotionRepository: PromotionRepository
  ) {
    this.usedPromotionRepository = usedPromotionRepository;
    this.promotionRepository = promotionRepository;
  }

  /**
   * Check if user can use this promotion code
   */
  async canUsePromotion(
    userId: string,
    promotionCode: string
  ): Promise<boolean> {
    const promotion = await this.promotionRepository.findByCode(promotionCode);
    if (!promotion) {
      return false;
    }

    // If not one-time-use, always allow
    if (!promotion.isOneTimeUse()) {
      return true;
    }

    // Check if user has used this promotion before
    const existingUsage =
      await this.usedPromotionRepository.findByUserIdAndPromotionCode(
        userId,
        promotionCode
      );

    if (!existingUsage) {
      return true; // Never used before
    }

    // Allow reuse if previous booking was cancelled, expired, or refunded
    const status = existingUsage.bookingStatus;
    return (
      status === BookingStatus.CANCELLED ||
      status === BookingStatus.EXPIRED ||
      status === BookingStatus.REFUNDED
    );
  }

  /**
   * Record promotion usage when booking is created
   */
  async recordPromotionUsage(
    request: RecordPromotionUsageRequest
  ): Promise<UsedPromotionResponse> {
    const existing =
      await this.usedPromotionRepository.findByUserIdAndPromotionCode(
        request.userId,
        request.promotionCode
      );

    if (existing) {
      const status = existing.bookingStatus;
      if (
        status === BookingStatus.CANCELLED ||
        status === BookingStatus.EXPIRED ||
        status === BookingStatus.REFUNDED
      ) {
        await this.usedPromotionRepository.delete(existing);
        console.info(
          `Deleted old promotion usage record for reuse: userId=${request.userId}, code=${request.promotionCode}`
        );
      } else {
        throw new Error("User has already used this promotion code");
      }
    }

    const usedPromotion = new UsedPromotion();
    usedPromotion.userId = request.userId;
    usedPromotion.promotionCode = request.promotionCode;
    usedPromotion.bookingId = request.bookingId;
    usedPromotion.bookingStatus = BookingStatus.PENDING;

    const saved = await this.usedPromotionRepository.save(usedPromotion);
    console.info(
      `Recorded promotion usage: userId=${request.userId}, code=${request.promotionCode}, bookingId=${request.bookingId}`
    );

    return this.mapToResponse(saved);
  }

  /**
   * Update booking status when booking status changes
   */
  async updateBookingStatus(
    request: UpdatePromotionUsageStatusRequest
  ): Promise<void> {
    const usedPromotion = await this.usedPromotionRepository.findByBookingId(
      request.bookingId
    );

    if (!usedPromotion) {
      console.warn(
        `No promotion usage found for bookingId: ${request.bookingId}`
      );
      return;
    }

    usedPromotion.bookingStatus = request.bookingStatus;
    await this.usedPromotionRepository.save(usedPromotion);

    console.info(
      `Updated promotion usage status: bookingId=${request.bookingId}, status=${request.bookingStatus}`
    );
  }

  /**
   * Get promotion usage by booking ID
   */
  async getByBookingId(
    bookingId: string
  ): Promise<UsedPromotionResponse | null> {
    const usedPromotion =
      await this.usedPromotionRepository.findByBookingId(bookingId);
    return usedPromotion ? this.mapToResponse(usedPromotion) : null;
  }

  private mapToResponse(entity: UsedPromotion): UsedPromotionResponse {
    return new UsedPromotionResponse(
      entity.id,
      entity.userId,
      entity.promotionCode,
      entity.bookingId,
      entity.bookingStatus,
      entity.usedAt
    );
  }
}
