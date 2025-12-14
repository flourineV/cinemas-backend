import { IsNotEmpty, IsString, IsNumber, Min } from "class-validator";

export class FnbItemRequest {
  @IsNotEmpty({ message: "Tên mục F&B không được để trống" })
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNotEmpty({ message: "Đơn giá không được để trống" })
  @IsNumber()
  @Min(0.01, { message: "Đơn giá phải lớn hơn 0" })
  unitPrice: number;

  @IsNotEmpty({ message: "URL hình ảnh không được để trống" })
  @IsString()
  imageUrl: string;
}
