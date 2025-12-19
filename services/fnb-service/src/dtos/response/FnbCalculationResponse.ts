// src/dto/response/FnbCalculationResponse.ts
import { CalculatedFnbItemDto } from "../response/CalculatedFnbItemDto";

export class FnbCalculationResponse {
  totalFnbPrice!: string;
  calculatedFnbItems!: CalculatedFnbItemDto[];
}
