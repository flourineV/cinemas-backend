export interface SeatRequest {
  roomId: string;
  seatNumber: string; // A01, B02
  rowLabel: string;   // A, B, C
  columnIndex: number; // 1,2,3
  type: string; // NORMAL, VIP, COUPLE
}