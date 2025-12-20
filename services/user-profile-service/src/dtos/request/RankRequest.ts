import {
  IsNotEmpty,
  IsString,
  IsInt,
  IsOptional,
  Min,
  Max,
  IsNumber,
} from "class-validator";

export class RankRequest {
  @IsString()
  @IsNotEmpty({ message: "Rank name is required" })
  name: string;

  @IsInt({ message: "Minimum points required" })
  minPoints: number;

  @IsOptional()
  @IsInt()
  maxPoints: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.0, { message: "Discount rate must be >= 0" })
  @Max(100.0, { message: "Discount rate must be <= 100" })
  discountRate: number;
}
