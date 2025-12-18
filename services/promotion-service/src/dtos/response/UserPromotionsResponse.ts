import { PromotionResponse } from "./PromotionResponse";

export class UserPromotionsResponse {
  applicable: ApplicablePromotionResponse[];
  notApplicable: NotApplicablePromotionResponse[];

  constructor(
    applicable: ApplicablePromotionResponse[],
    notApplicable: NotApplicablePromotionResponse[]
  ) {
    this.applicable = applicable;
    this.notApplicable = notApplicable;
  }
}

export class ApplicablePromotionResponse {
  promotion: PromotionResponse;

  constructor(promotion: PromotionResponse) {
    this.promotion = promotion;
  }
}

export class NotApplicablePromotionResponse {
  promotion: PromotionResponse;

  constructor(promotion: PromotionResponse) {
    this.promotion = promotion;
  }
}
