import type { Booking } from '../models/Booking.js';
import type { BookingSeat } from '../models/BookingSeat.js';
import type { BookingResponse } from '../dto/response/BookingResponse.js';
import type { BookingSeatResponse } from '../dto/response/BookingSeatResponse.js';

export class BookingMapper {
  static toSeatResponse(seat: BookingSeat): BookingSeatResponse {
    return {
      seatId: seat.seatId,
      ...(seat.seatNumber !== undefined && { seatNumber: seat.seatNumber }),
      seatType: seat.seatType,
      ticketType: seat.ticketType,
      price: seat.price,
    };
  }

  static toSeatResponses(seats: BookingSeat[]): BookingSeatResponse[] {
    return seats.map((s) => this.toSeatResponse(s));
  }

  static toBookingResponse(booking: Booking): BookingResponse {
    return {
        bookingId: booking.id,
        bookingCode: booking.bookingCode,
        showtimeId: booking.showtimeId,
        status: booking.status,
        totalPrice: booking.totalPrice,
        discountAmount: booking.discountAmount,
        finalPrice: booking.finalPrice,
        seats: this.toSeatResponses(booking.seats ?? []),

        ...(booking.userId && { userId: booking.userId }),
        ...(booking.movieId && { movieId: booking.movieId }),
        ...(booking.movieTitle && { movieTitle: booking.movieTitle }),
        ...(booking.movieTitleEn && { movieTitleEn: booking.movieTitleEn }),
        ...(booking.theaterName && { theaterName: booking.theaterName }),
        ...(booking.theaterNameEn && { theaterNameEn: booking.theaterNameEn }),
        ...(booking.roomName && { roomName: booking.roomName }),
        ...(booking.roomNameEn && { roomNameEn: booking.roomNameEn }),
        // ...(booking.guestName && { guestName: booking.guestName }),
        // ...(booking.guestEmail && { guestEmail: booking.guestEmail }),
        ...(booking.paymentMethod && { paymentMethod: booking.paymentMethod }),
        ...(booking.paymentId && { transactionId: booking.paymentId }),

        ...(booking.showDateTime && {
        showDateTime: booking.showDateTime.toISOString(),
        }),
    };
  }
}
