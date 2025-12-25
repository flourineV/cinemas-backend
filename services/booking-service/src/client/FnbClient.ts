import axios from "axios";
import type { AxiosInstance } from "axios"
import CircuitBreaker from "opossum";
import type{FnbItemResponse} from "../dto/external/FnbItemResponse.js";
import type { FnbCalculationRequest } from "../dto/external/FnbCalculationRequest.js";
import type { FnbCalculationResponse } from "../dto/external/FnbCalculationResponse.js";

export class FnbClient {
  private client: AxiosInstance;
  private getItemBreaker: CircuitBreaker<[string], FnbItemResponse>;
  private calculateBreaker: CircuitBreaker<[FnbCalculationRequest], FnbCalculationResponse>;

  constructor(baseURL: string) {
    // Axios instance for F&B service
    this.client = axios.create({
      baseURL,
      timeout: 5000, // 5s timeout
    });

    // Circuit breaker options
    const options = {
      timeout: 3000,               // fail if call > 3s
      errorThresholdPercentage: 50, // open breaker if 50% of calls fail
      resetTimeout: 10000,          // try again after 10s
    };
    // Circuit breaker for getFnbItemById
    this.getItemBreaker = new CircuitBreaker(this._getFnbItem.bind(this), options);
    this.getItemBreaker.fallback((id: string) => ({
      id,
      name: "Unknown Item",
      unitPrice: 0,
    }));

    // Circuit breaker for calculatePrice
    this.calculateBreaker = new CircuitBreaker(this._calculatePrice.bind(this), options);
    this.calculateBreaker.fallback((req: FnbCalculationRequest) => ({
      totalFnbPrice: 0,
      calculatedFnbItems: null,
    }));
  }
  // Public API
  async getFnbItemById(id: string): Promise<FnbItemResponse> {
    return this.getItemBreaker.fire(id);
  }

  async calculatePrice(req: FnbCalculationRequest): Promise<FnbCalculationResponse> {
    return this.calculateBreaker.fire(req);
  }
  // Private helpers
  private async _getFnbItem(id: string): Promise<FnbItemResponse> {
    const res = await this.client.get<FnbItemResponse>(`/api/fnb/${id}`);
    return res.data;
  }

  private async _calculatePrice(req: FnbCalculationRequest): Promise<FnbCalculationResponse> {
    const res = await this.client.post<FnbCalculationResponse>(`/api/fnb/calculate`, req);
    return res.data;
  }
}
