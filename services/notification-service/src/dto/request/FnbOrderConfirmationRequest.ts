import { Type } from "class-transformer";
import { ValidateNested, IsUUID, IsString, IsNumber } from "class-validator";

export class FnbItemDetail {
  @IsString()
  itemName!: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  unitPrice!: number; 

  @IsNumber()
  totalPrice!: number;
}

export class FnbOrderConfirmationRequest {
  @IsUUID()
  userId!: string;

  @IsString()
  userEmail!: string;

  @IsString()
  userName!: string;

  @IsString()
  orderCode!: string;

  @IsUUID()
  theaterId!: string;

  @IsNumber()
  totalAmount!: number;

  @ValidateNested({ each: true })
  @Type(() => FnbItemDetail)
  items!: FnbItemDetail[];
}
