import { DiscountType } from "../../models/DiscountType";
export class PromotionValidationResponse {
  code: string;
  discountType: DiscountType;
  discountValue: string;
  isOneTimeUse: boolean;

  constructor(
    code: string,
    discountType: DiscountType,
    discountValue: string,
    isOneTimeUse: boolean
  ) {
    this.code = code;
    this.discountType = discountType;
    this.discountValue = discountValue;
    this.isOneTimeUse = isOneTimeUse;
  }
}
