export class SeatPriceResponse {
  seatType: string;
  ticketType: string;
  basePrice: number;

  constructor(seatType: string, ticketType: string, basePrice: number) {
    this.seatType = seatType;
    this.ticketType = ticketType;
    this.basePrice = basePrice;
  }
}
