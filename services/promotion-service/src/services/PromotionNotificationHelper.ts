import { NotificationClient } from "../config/NotificationClient";
import {
  Promotion,
  PromotionType,
  UsageTimeRestriction,
} from "../models/Promotion.entity";
import { PromotionNotificationRequest } from "../dtos/request/PromotionNotificationRequest";

export class PromotionNotificationHelper {
  private notificationClient: NotificationClient;

  constructor(notificationClient: NotificationClient) {
    this.notificationClient = notificationClient;
  }

  async sendPromotionNotification(promotion: Promotion): Promise<void> {
    // Format discount display
    const discountDisplay =
      promotion.discountType === "PERCENTAGE"
        ? `${promotion.discountValue}%`
        : `${Number(promotion.discountValue).toLocaleString("vi-VN")} VNĐ`;

    // Format usage restriction
    const usageRestriction = this.buildUsageRestriction(promotion);

    // Format valid until
    const validUntil = new Date(promotion.endDate).toLocaleString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    // Build notification request
    const notifRequest = new PromotionNotificationRequest(
      promotion.code,
      promotion.promotionType,
      promotion.discountType,
      promotion.discountValue.toString(),
      discountDisplay,
      promotion.description ?? "",
      promotion.promoDisplayUrl ?? "",
      new Date(promotion.startDate),
      new Date(promotion.endDate),
      validUntil,
      usageRestriction,
      "https://cinehub.com/movies"
    );

    await this.notificationClient.sendPromotionNotification(notifRequest);
    console.info(`Sent promotion notification for code: ${promotion.code}`);
  }

  private buildUsageRestriction(promotion: Promotion): string {
    if (
      !promotion.usageTimeRestriction ||
      promotion.usageTimeRestriction === UsageTimeRestriction.NONE
    ) {
      return "Áp dụng mọi lúc";
    }

    switch (promotion.usageTimeRestriction) {
      case UsageTimeRestriction.WEEKEND_ONLY:
        return "Chỉ áp dụng cuối tuần";
      case UsageTimeRestriction.WEEKDAY_ONLY:
        return "Chỉ áp dụng ngày trong tuần";
      case UsageTimeRestriction.CUSTOM_DAYS: {
        let parts: string[] = [];
        if (promotion.allowedDaysOfWeek) {
          parts.push(`Áp dụng vào: ${promotion.allowedDaysOfWeek}`);
        }
        if (promotion.allowedDaysOfMonth) {
          parts.push(`Ngày ${promotion.allowedDaysOfMonth} trong tháng`);
        }
        return parts.length > 0
          ? parts.join(", ")
          : "Áp dụng theo lịch tùy chỉnh";
      }
      default:
        return "Áp dụng mọi lúc";
    }
  }
}
