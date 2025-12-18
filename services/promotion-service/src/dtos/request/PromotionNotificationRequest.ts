export class PromotionNotificationRequest {
  promotionCode: string;
  promotionType: string;
  discountType: string;
  discountValue: string;
  discountValueDisplay: string;
  description: string;
  promoDisplayUrl: string;
  startDate: string;
  endDate: string;
  validUntil: string;
  usageRestriction: string;
  actionUrl: string;

  constructor(
    promotionCode: string,
    promotionType: string,
    discountType: string,
    discountValue: string,
    discountValueDisplay: string,
    description: string,
    promoDisplayUrl: string,
    startDate: Date,
    endDate: Date,
    validUntil: string,
    usageRestriction: string,
    actionUrl: string
  ) {
    this.promotionCode = promotionCode;
    this.promotionType = promotionType;
    this.discountType = discountType;
    this.discountValue = discountValue;
    this.discountValueDisplay = discountValueDisplay;
    this.description = description;
    this.promoDisplayUrl = promoDisplayUrl;
    this.startDate = startDate.toISOString();
    this.endDate = endDate.toISOString();
    this.validUntil = validUntil;
    this.usageRestriction = usageRestriction;
    this.actionUrl = actionUrl;
  }
}
