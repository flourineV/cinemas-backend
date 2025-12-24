import { SeatStatus } from '../../models/enums/SeatStatus.js';
export interface UpdateSeatStatusRequest {
  showtimeId: string;
  seatId: string;
  status: SeatStatus;
}