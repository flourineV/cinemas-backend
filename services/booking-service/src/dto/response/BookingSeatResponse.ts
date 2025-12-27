export interface BookingSeatResponse {
  seatId: string; // UUID
  seatNumber?: string;
  seatType: string;
  ticketType: string;
  price: string; // numeric as string
}
