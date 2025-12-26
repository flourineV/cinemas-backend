import axios from "axios";
import type { AxiosInstance } from "axios";
import CircuitBreaker from "opossum";
import { v4 as uuidv4 } from "uuid";
import { DiscountType } from "../models/DiscountType.js";
import type { PromotionValidationResponse } from "../dto/external/PromotionValidationResponse.js";
import type { RefundVoucherResponse } from "../dto/response/RefundVoucherResponse.js";
import { BookingException } from "../exception/BookingException.js";

export class PromotionClient {
  private client: AxiosInstance;

  // Circuit breakers
  private validatePromoBreaker: CircuitBreaker<[string], PromotionValidationResponse>;
  private createRefundBreaker: CircuitBreaker<[string, string], RefundVoucherResponse>;
  private markUsedBreaker: CircuitBreaker<[string], RefundVoucherResponse>;

  constructor(baseURL: string) {
    this.client = axios.create({
      baseURL,
      timeout: 5000,
    });

    const options = {
      timeout: 3000,
      errorThresholdPercentage: 50,
      resetTimeout: 10000,
    };

    this.validatePromoBreaker = new CircuitBreaker(this._validatePromotion.bind(this), options);
    this.validatePromoBreaker.fallback((promoCode: string) => ({
      code: promoCode,
      discountType: DiscountType.PERCENTAGE,
      discountValue: "0",
      isOneTimeUse: false,
    }));

    this.createRefundBreaker = new CircuitBreaker(this._createRefundVoucher.bind(this), options);
    this.createRefundBreaker.fallback((userId: string, value: string) => ({
      id: uuidv4(),
      code: "N/A",
      userId,
      value: "0",
      isUsed: false,
    }));

    this.markUsedBreaker = new CircuitBreaker(this._markVoucherUsed.bind(this), options);
    this.markUsedBreaker.fallback((code: string) => ({
      id: uuidv4(),
      code,
      userId: "N/A",
      value: "0",
      isUsed: true,
    }));
  }

  // Public API
  async validatePromotionCode(promoCode: string): Promise<PromotionValidationResponse> {
    return this.validatePromoBreaker.fire(promoCode);
  }

  async createRefundVoucher(userId: string, value: string): Promise<RefundVoucherResponse> {
    return this.createRefundBreaker.fire(userId, value);
  }

  async markRefundVoucherAsUsed(code: string): Promise<RefundVoucherResponse> {
    return this.markUsedBreaker.fire(code);
  }

  async canUsePromotion(userId: string, promoCode: string): Promise<boolean> {
    try {
      const res = await this.client.get<boolean>("/api/promotions/usage/can-use", {
        params: { userId, promotionCode: promoCode },
      });
      return res.data;
    } catch (err: any) {
      console.error("Fallback: canUsePromotion triggered", err.message);
      return true; // allow by default
    }
  }

  async recordPromotionUsage(userId: string, promoCode: string, bookingId: string): Promise<void> {
    try {
      await this.client.post("/api/promotions/usage/record", {
        userId,
        promotionCode: promoCode,
        bookingId,
      });
    } catch (err: any) {
      console.error("Fallback: recordPromotionUsage triggered", err.message);
    }
  }

  async updatePromotionUsageStatus(bookingId: string, bookingStatus: string): Promise<void> {
    try {
      await this.client.patch("/api/promotions/usage/update-status", {
        bookingId,
        bookingStatus,
      });
    } catch (err: any) {
      console.error("Fallback: updatePromotionUsageStatus triggered", err.message);
    }
  }

  // Private helpers
  private async _validatePromotion(promoCode: string): Promise<PromotionValidationResponse> {
    try {
      const res = await this.client.get<PromotionValidationResponse>("/api/promotions/validate", {
        params: { code: promoCode },
      });
      return res.data;
    } catch (err: any) {
      throw new BookingException("Mã khuyến mãi không hợp lệ hoặc đã hết hạn.");
    }
  }

  private async _createRefundVoucher(userId: string, value: string): Promise<RefundVoucherResponse> {
    const expiredAt = new Date();
    expiredAt.setMonth(expiredAt.getMonth() + 2);

    try {
      const res = await this.client.post<RefundVoucherResponse>("/api/promotions/refund-vouchers", {
        userId,
        value,
        expiredAt,
      });
      return res.data;
    } catch (err: any) {
      throw new BookingException("Không thể tạo refund voucher.");
    }
  }

  private async _markVoucherUsed(code: string): Promise<RefundVoucherResponse> {
    try {
      const res = await this.client.put<RefundVoucherResponse>(`/api/promotions/refund-vouchers/use/${code}`);
      return res.data;
    } catch (err: any) {
      throw new BookingException(`Không thể đánh dấu voucher đã dùng: ${code}`);
    }
  }
}
