import type { BookingStatus } from '../../models/BookingStatus.js';

export interface BookingCriteria {
  keyword?: string; // Partial match: userId, showtimeId, bookingCode, guestName
  userId?: string; // UUID
  userIds?: string[]; // multiple matching users
  username?: string; // partial match on fullName
  showtimeId?: string; // UUID
  movieId?: string; // UUID
  bookingCode?: string;
  status?: BookingStatus;
  paymentMethod?: string;
  guestName?: string;
  guestEmail?: string;
  fromDate?: string; // ISO string
  toDate?: string; // ISO string
  minPrice?: string; // numeric as string
  maxPrice?: string; // numeric as string
}
