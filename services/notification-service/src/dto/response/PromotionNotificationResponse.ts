export interface PromotionNotificationResponse {
  message: string;
  emailsSent: number;
  emailsFailed: number;
  promotionCode: string;
}
