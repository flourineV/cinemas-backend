import {
  IsNotEmpty,
  IsString,
  IsInt,
  Min,
  Max,
  IsNumber,
} from "class-validator";

export class RankRequest {
  @IsNotEmpty({ message: "Rank name is required" })
  @IsString()
  name: string;

  @IsNotEmpty({ message: "Minimum points required" })
  @IsInt()
  minPoints: number;

  maxPoints: number;

  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: "Discount rate must be a number" }
  )
  @Min(0, { message: "Discount rate must be >= 0" })
  @Max(100, { message: "Discount rate must be <= 100" })
  discountRate: number;
}
