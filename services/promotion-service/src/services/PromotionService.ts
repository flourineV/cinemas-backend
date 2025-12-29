import { PromotionRepository } from "../repositories/PromotionRepository";
import { UsedPromotionRepository } from "../repositories/UsedPromotionRepository";
import { PromotionNotificationHelper } from "./PromotionNotificationHelper";
import { PromotionRequest } from "../dtos/request/PromotionRequest";
import { PromotionResponse } from "../dtos/response/PromotionResponse";
import { PromotionValidationResponse } from "../dtos/response/PromotionValidationResponse";
import {
  UserPromotionsResponse,
  ApplicablePromotionResponse,
  NotApplicablePromotionResponse,
} from "../dtos/response/UserPromotionsResponse";
import {
  Promotion,
  PromotionType,
  UsageTimeRestriction,
} from "../models/Promotion.entity";

export class PromotionService {
  private promotionRepository: PromotionRepository;
  private usedPromotionRepository: UsedPromotionRepository;
  private notificationHelper: PromotionNotificationHelper;

  constructor(
    promotionRepository: PromotionRepository,
    usedPromotionRepository: UsedPromotionRepository,
    notificationHelper: PromotionNotificationHelper
  ) {
    this.promotionRepository = promotionRepository;
    this.usedPromotionRepository = usedPromotionRepository;
    this.notificationHelper = notificationHelper;
  }

  async validatePromotionCode(
    code: string
  ): Promise<PromotionValidationResponse> {
    const now = new Date();

    const promotion = await this.promotionRepository.findValidPromotionByCode(
      code,
      now
    );
    if (!promotion) {
      throw new Error(
        "Mã khuyến mãi không hợp lệ, không tồn tại hoặc đã hết hạn."
      );
    }

    if (!this.isValidTimeRestriction(promotion, now)) {
      throw new Error("Mã khuyến mãi không áp dụng cho thời điểm hiện tại.");
    }

    return new PromotionValidationResponse(
      promotion.code,
      promotion.discountType,
      promotion.discountValue.toString(),
      promotion.isOneTimeUse()
    );
  }

  private isValidTimeRestriction(promotion: Promotion, now: Date): boolean {
    if (
      !promotion.usageTimeRestriction ||
      promotion.usageTimeRestriction === UsageTimeRestriction.NONE
    ) {
      return true;
    }

    const dayOfWeek = now.getDay(); // 0=Sunday, 6=Saturday
    const dayOfMonth = now.getDate();

    switch (promotion.usageTimeRestriction) {
      case UsageTimeRestriction.WEEKEND_ONLY:
        return dayOfWeek === 0 || dayOfWeek === 6;
      case UsageTimeRestriction.WEEKDAY_ONLY:
        return dayOfWeek >= 1 && dayOfWeek <= 5;
      case UsageTimeRestriction.CUSTOM_DAYS:
        return this.isValidCustomDays(promotion, dayOfWeek, dayOfMonth);
      default:
        return true;
    }
  }

  private isValidCustomDays(
    promotion: Promotion,
    dayOfWeek: number,
    dayOfMonth: number
  ): boolean {
    if (promotion.allowedDaysOfWeek) {
      const allowedDays = promotion.allowedDaysOfWeek.split(",");
      const dayNames = [
        "SUNDAY",
        "MONDAY",
        "TUESDAY",
        "WEDNESDAY",
        "THURSDAY",
        "FRIDAY",
        "SATURDAY",
      ];
      if (
        !allowedDays.some(
          (d) => dayNames[dayOfWeek].toUpperCase() === d.trim().toUpperCase()
        )
      ) {
        return false;
      }
    }

    if (promotion.allowedDaysOfMonth) {
      const allowedDays = promotion.allowedDaysOfMonth.split(",");
      if (!allowedDays.some((d) => parseInt(d.trim()) === dayOfMonth)) {
        return false;
      }
    }

    return true;
  }

  async getAllPromotions(): Promise<PromotionResponse[]> {
    const promotions = await this.promotionRepository.findAll();
    return promotions
      .filter((p) => p.isActive)
      .map((p) => this.mapToResponse(p));
  }

  async getActivePromotions(): Promise<PromotionResponse[]> {
    const now = new Date();
    const promotions = await this.promotionRepository.findAll();
    return promotions
      .filter((p) => p.isActive)
      .filter((p) => p.startDate && p.startDate < now)
      .filter((p) => p.endDate && p.endDate > now)
      .map((p) => this.mapToResponse(p));
  }

  async getActivePromotionsForUser(
    userId: string
  ): Promise<UserPromotionsResponse> {
    const now = new Date();
    const promotions = await this.promotionRepository.findAll();
    const activePromotions = promotions
      .filter((p) => p.isActive)
      .filter((p) => p.startDate && p.startDate < now)
      .filter((p) => p.endDate && p.endDate > now);

    const applicable: ApplicablePromotionResponse[] = [];
    const notApplicable: NotApplicablePromotionResponse[] = [];

    for (const promotion of activePromotions) {
      if (
        promotion.isOneTimeUse() &&
        (await this.usedPromotionRepository.existsByUserIdAndPromotionCode(
          userId,
          promotion.code
        ))
      ) {
        notApplicable.push(
          new NotApplicablePromotionResponse(this.mapToResponse(promotion))
        );
        continue;
      }

      if (!this.isValidTimeRestriction(promotion, now)) {
        notApplicable.push(
          new NotApplicablePromotionResponse(this.mapToResponse(promotion))
        );
        continue;
      }

      applicable.push(
        new ApplicablePromotionResponse(this.mapToResponse(promotion))
      );
    }

    return new UserPromotionsResponse(applicable, notApplicable);
  }

  async getAllPromotionsForAdmin(
    code?: string,
    discountType?: string,
    promotionType?: string,
    isActive?: boolean
  ): Promise<PromotionResponse[]> {
    const promotions = await this.promotionRepository.findAll();
    return promotions
      .filter((p) => !code || p.code.toLowerCase().includes(code.toLowerCase()))
      .filter(
        (p) =>
          !discountType ||
          p.discountType.toUpperCase() === discountType.toUpperCase()
      )
      .filter(
        (p) =>
          !promotionType ||
          p.promotionType.toUpperCase() === promotionType.toUpperCase()
      )
      .filter((p) => isActive === undefined || p.isActive === isActive)
      .map((p) => this.mapToResponse(p));
  }

  async createPromotion(request: PromotionRequest): Promise<PromotionResponse> {
    if (await this.promotionRepository.findByCode(request.code)) {
      throw new Error("Mã khuyến mãi đã tồn tại.");
    }

    const newPromo = this.mapToEntity(request);
    const savedPromo = await this.promotionRepository.save(newPromo);
    console.info(`⭐ Created new promotion: ${savedPromo.code}`);

    try {
      await this.notificationHelper.sendPromotionNotification(savedPromo);
    } catch (e: any) {
      console.error(
        `Failed to send promotion notification for ${savedPromo.code}: ${e.message}`
      );
    }

    return this.mapToResponse(savedPromo);
  }

  async updatePromotion(
    id: string,
    request: PromotionRequest
  ): Promise<PromotionResponse> {
    const existingPromo = await this.promotionRepository.findById(id);
    if (!existingPromo) {
      throw new Error(`Promotion not found with ID: ${id}`);
    }

    if (
      existingPromo.code !== request.code &&
      (await this.promotionRepository.findByCode(request.code))
    ) {
      throw new Error(
        "Mã khuyến mãi mới đã được sử dụng bởi chương trình khác."
      );
    }

    existingPromo.code = request.code;
    existingPromo.discountType = request.discountType;
    existingPromo.discountValue = request.discountValue;
    existingPromo.startDate = request.startDate;
    existingPromo.endDate = request.endDate;
    existingPromo.isActive = request.isActive;
    existingPromo.description = request.description;
    existingPromo.promoDisplayUrl = request.promoDisplayUrl;

    const updatedPromo = await this.promotionRepository.save(existingPromo);
    console.info(`🔄 Updated promotion: ${updatedPromo.code}`);
    return this.mapToResponse(updatedPromo);
  }

  async deletePromotion(id: string): Promise<void> {
    if (!(await this.promotionRepository.existsById(id))) {
      throw new Error(`Promotion not found with ID: ${id}`);
    }
    await this.promotionRepository.deleteById(id);
    console.warn(`🗑️ Deleted promotion with ID: ${id}`);
  }

  // --- Helper Mappers ---
  private mapToEntity(request: PromotionRequest): Promotion {
    const promo = new Promotion();
    promo.code = request.code;
    promo.promotionType = request.promotionType ?? PromotionType.GENERAL;
    promo.discountType = request.discountType;
    promo.discountValue = request.discountValue;
    promo.startDate = request.startDate;
    promo.endDate = request.endDate;
    promo.isActive = request.isActive;
    promo.usageTimeRestriction = request.usageTimeRestriction!;
    promo.allowedDaysOfWeek = request.allowedDaysOfWeek!;
    promo.allowedDaysOfMonth = request.allowedDaysOfMonth!;
    promo.description = request.description;
    promo.promoDisplayUrl = request.promoDisplayUrl;
    return promo;
  }

  private mapToResponse(promotion: Promotion): PromotionResponse {
    return new PromotionResponse(
      promotion.id,
      promotion.code,
      promotion.promotionType,
      promotion.discountType,
      promotion.discountValue.toString(),
      promotion.startDate,
      promotion.endDate,
      promotion.isActive,
      promotion.usageTimeRestriction!,
      promotion.allowedDaysOfWeek!,
      promotion.allowedDaysOfMonth!,
      promotion.description,
      promotion.promoDisplayUrl
    );
  }
}
