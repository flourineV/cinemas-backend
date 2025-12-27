export interface FinalizeBookingRequest {
  fnbItems?: CalculatedFnbItemDto[];
  promotionCode?: string;
  refundVoucherCode?: string;
  useLoyaltyDiscount: boolean;
  language?: string; // 'vi' or 'en'
}

export interface CalculatedFnbItemDto {
  fnbItemId: string; // UUID
  quantity: number;
  unitPrice: string; // numeric as string
  totalFnbItemPrice: string; // numeric as string
}
