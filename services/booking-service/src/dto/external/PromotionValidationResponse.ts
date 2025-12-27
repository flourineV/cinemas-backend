import type { DiscountType } from '../../models/DiscountType.js';

export interface PromotionValidationResponse {
  code: string;
  discountType: DiscountType;
  discountValue: string; // numeric as string
  isOneTimeUse: boolean;
}
