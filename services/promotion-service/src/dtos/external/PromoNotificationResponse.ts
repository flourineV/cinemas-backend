export class PromoNotificationResponse {
  message: string;
  emailsSent: number;
  emailsFailed: number;
  promotionCode: string;

  constructor(
    message: string,
    emailsSent: number,
    emailsFailed: number,
    promotionCode: string
  ) {
    this.message = message;
    this.emailsSent = emailsSent;
    this.emailsFailed = emailsFailed;
    this.promotionCode = promotionCode;
  }
}
