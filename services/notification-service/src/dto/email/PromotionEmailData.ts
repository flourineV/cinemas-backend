export class PromotionEmailData {
  code: string;
  description: string;
  discountValue: number; 
  startDate: Date;      
  endDate: Date;
  oneTimeUse: boolean;
  discountTypeName: string;

  constructor(
    code: string,
    description: string,
    discountValue: number,
    startDate: Date,
    endDate: Date,
    oneTimeUse: boolean,
    discountTypeName: string
  ) {
    this.code = code;
    this.description = description;
    this.discountValue = discountValue;
    this.startDate = startDate;
    this.endDate = endDate;
    this.oneTimeUse = oneTimeUse;
    this.discountTypeName = discountTypeName;
  }

  getDiscountType(): DiscountTypeData {
    return new DiscountTypeData(this.discountTypeName);
  }
}

export class DiscountTypeData {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}
