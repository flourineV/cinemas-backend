// src/dto/SeatPriceRequest.ts
import {
  IsNotEmpty,
  IsString,
  IsNumber,
  Min,
  IsOptional,
} from "class-validator";

export class SeatPriceRequest {
  @IsString()
  @IsNotEmpty()
  seatType: string;

  @IsString()
  @IsNotEmpty()
  ticketType: string;

  @IsNumber()
  @Min(0.01)
  basePrice: number;

  @IsOptional()
  @IsString()
  description: string;

  constructor(
    seatType: string,
    ticketType: string,
    basePrice: number,
    description: string
  ) {
    this.seatType = seatType;
    this.ticketType = ticketType;
    this.basePrice = basePrice;
    this.description = description;
  }
}
