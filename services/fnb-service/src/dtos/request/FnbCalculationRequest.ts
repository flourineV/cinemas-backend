import { ValidateNested, IsNotEmpty } from "class-validator";
import { Type } from "class-transformer";
import { FnbItemDto } from "./FnbItemDto";

export class FnbCalculationRequest {
  @ValidateNested({ each: true })
  @Type(() => FnbItemDto)
  @IsNotEmpty({ message: "Danh sách F&B không được để trống" })
  selectedFnbItems!: FnbItemDto[];
}
