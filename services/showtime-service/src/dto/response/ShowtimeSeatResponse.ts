export type SeatStatus = "AVAILABLE" | "LOCKED" | "BOOKED" | "UNAVAILABLE";

export interface ShowtimeSeatResponse {
  seatId: string;
  seatNumber: string;
  type: string; // NORMAL, VIP, COUPLE
  status: SeatStatus;
}