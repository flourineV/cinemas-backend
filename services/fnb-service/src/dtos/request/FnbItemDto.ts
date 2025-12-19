import { IsUUID, IsNotEmpty, IsInt, Min } from "class-validator";

export class FnbItemDto {
  @IsUUID()
  @IsNotEmpty()
  fnbItemId: string;

  @IsInt()
  @Min(1, { message: "Số lượng phải >= 1" })
  @IsNotEmpty()
  quantity: number;
}
