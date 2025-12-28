// src/dto/request/FnbOrderRequest.ts
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  ValidateNested,
  IsInt,
  Min,
  isString,
} from "class-validator";
import { Type } from "class-transformer";

export class FnbOrderItemRequest {
  @IsUUID()
  fnbItemId: string;

  @IsInt()
  @Min(1, { message: "Số lượng phải >= 1" })
  quantity: number;
}

export class FnbOrderRequest {
  @IsUUID()
  userId: string;

  @IsUUID()
  theaterId: string;

  @IsString()
  paymentMethod: string;

  @ValidateNested({ each: true })
  @Type(() => FnbOrderItemRequest)
  items: FnbOrderItemRequest[];

  @IsString()
  language: string;
}
