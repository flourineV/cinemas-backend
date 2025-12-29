import type { SeatDetail } from './SeatDetail.js';
import type { FnbDetail } from './FnbDetail.js';
import type { PromotionDetail } from './PromotionDetail.js';

export interface BookingTicketGeneratedEvent {
  bookingId: string; // UUID
  bookingCode: string;
  userId: string; // UUID
  // guestName: string;
  // guestEmail: string;
  movieTitle: string;
  cinemaName: string;
  roomName: string;
  showDateTime: string; // ISO string
  seats: SeatDetail[];
  fnbs: FnbDetail[];
  promotion?: PromotionDetail;
  totalPrice: string; // numeric as string
  rankName?: string;
  rankDiscountAmount?: string; // numeric as string
  finalPrice: string; // numeric as string
  paymentMethod: string;
  createdAt: string; // ISO string
  language: string; // 'vi' or 'en'
}
