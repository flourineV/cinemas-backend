import type { CalculatedFnbItemDto } from '../request/FinalizeBookingRequest.js';

export interface FnbCalculationResponse {
  totalFnbPrice: string; // numeric as string
  calculatedFnbItems: CalculatedFnbItemDto[];
}
