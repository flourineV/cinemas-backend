import axios from "axios";
import type { AxiosInstance } from "axios"
import CircuitBreaker from "opossum";
import type { SeatPriceResponse } from "../dto/external/SeatPriceResponse.js";
import { BookingException } from "../exception/BookingException.js";

export class PricingClient {
  private client: AxiosInstance;
  private getSeatPriceBreaker: CircuitBreaker<[string, string], SeatPriceResponse>;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000, // 5s timeout
    });

    const options = {
      timeout: 3000,               // fail if call > 3s
      errorThresholdPercentage: 50,
      resetTimeout: 10000,         // retry after 10s
    };

    // Circuit breaker for getSeatPrice
    this.getSeatPriceBreaker = new CircuitBreaker(this._getSeatPrice.bind(this), options);
    this.getSeatPriceBreaker.fallback((seatType: string, ticketType: string) => ({
      seatType,
      ticketType,
      basePrice: "0",
    }));
  }
  // Public API
  async getSeatPrice(seatType: string, ticketType: string): Promise<SeatPriceResponse> {
    return this.getSeatPriceBreaker.fire(seatType, ticketType);
  }

  // Private helper
  private async _getSeatPrice(seatType: string, ticketType: string): Promise<SeatPriceResponse> {
    try {
      const res = await this.client.get<SeatPriceResponse>("/api/pricing/seat-price", {
        params: { seatType, ticketType },
      });

      return res.data;
    } catch (err: any) {
      // Map 4xx errors to BookingException
      if (err.response && err.response.status >= 400 && err.response.status < 500) {
        throw new BookingException( `Không tìm thấy mức giá cho loại ghế/vé này: seatType=${seatType}, ticketType=${ticketType}` );
      }
      throw err;
    }
  }
}
