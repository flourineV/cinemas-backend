import axios, { AxiosInstance } from "axios";

export class BookingClient {
  private readonly http: AxiosInstance;
  private readonly bookingServiceUrl: string;
  private readonly internalSecret: string;

  constructor() {
    this.bookingServiceUrl =
      process.env.BOOKING_SERVICE_URL || "http://localhost:8085";
    this.internalSecret = process.env.INTERNAL_SECRET_KEY || "BatLuongNhan";

    this.http = axios.create({
      baseURL: this.bookingServiceUrl,
      headers: {
        "X-Internal-Secret": this.internalSecret,
      },
    });
  }

  async getBookingCountByUserId(userId: string): Promise<number> {
    try {
      const response = await this.http.get<number>(
        `/api/bookings/count?userId=${userId}`
      );
      return response.data ?? 0;
    } catch (error: any) {
      console.error(
        `Failed to get booking count for userId ${userId}: ${error.message}`
      );
      return 0;
    }
  }
}
