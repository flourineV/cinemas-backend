import type { SeatDetail } from "../dto/external/SeatDetail.js";
import type{ FnbDetail } from "../dto/external/FnbDetail.js";
import type { PromotionDetail } from "../dto/external/PromotionDetail.js";

export interface BookingTicketGeneratedEvent {
  bookingId: string;
  bookingCode: string;
  userId?: string;
  guestName?: string;
  guestEmail?: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  showDateTime: string; // ISO string
  seats: SeatDetail[];
  fnbs: FnbDetail[];
  promotion?: PromotionDetail;
  totalPrice: number;
  rankName: string | null;
  rankDiscountAmount: number;
  finalPrice: number;
  paymentMethod: string;
  createdAt: Date;
  language?: string;
}
