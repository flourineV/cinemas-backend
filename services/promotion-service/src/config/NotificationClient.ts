import axios, { AxiosInstance } from "axios";
import { PromotionNotificationRequest } from "../dtos/request/PromotionNotificationRequest";
import { PromoNotificationResponse } from "../dtos/external/PromoNotificationResponse";

export class NotificationClient {
  private notificationHttpClient: AxiosInstance;

  constructor(baseURL: string) {
    this.notificationHttpClient = axios.create({
      baseURL,
      timeout: 5000,
    });
  }

  async sendPromotionNotification(
    request: PromotionNotificationRequest
  ): Promise<PromoNotificationResponse | null> {
    try {
      const response =
        await this.notificationHttpClient.post<PromoNotificationResponse>(
          "/api/notifications/promotion",
          request
        );
      return response.data;
    } catch (error: any) {
      console.error(
        `Failed to send promotion notification: ${error.message ?? error}`
      );
      return null;
    }
  }
}
