import { IsNotEmpty, IsString, IsNumberString, Min } from "class-validator";

export class FnbItemRequest {
  @IsNotEmpty({ message: "Tên mục F&B không được để trống" })
  @IsString()
  name: string;

  @IsString()
  nameEn: string;

  @IsString()
  description: string;

  @IsString()
  descriptionEn: string;

  @IsNotEmpty({ message: "Đơn giá không được để trống" })
  @IsNumberString()
  @Min(0.01, { message: "Đơn giá phải lớn hơn 0" })
  unitPrice: string;

  @IsNotEmpty({ message: "URL hình ảnh không được để trống" })
  @IsString()
  imageUrl: string;
}
