export class MessageTemplateService {
  // ========== BOOKING TICKET TEMPLATES ==========

  getBookingTicketTitle(language: string): string {
    return language.toLowerCase() === "en"
      ? "Your movie ticket is ready!"
      : "Vé xem phim của bạn đã sẵn sàng!";
  }

  getBookingTicketMessage(
    language: string,
    movieTitle: string,
    cinemaName: string,
    showDateTime: string,
    roomName: string,
    totalPrice: number,
    rankName: string | null,
    rankDiscountAmount: number,
    promotionCode: string | null,
    promotionDiscountAmount: number,
    finalPrice: number,
    paymentMethod: string
  ): string {
    if (language.toLowerCase() === "en") {
      return `
        You have successfully booked tickets for <b>${movieTitle}</b> at <b>${cinemaName}</b> cinema.<br>
        Showtime: <b>${showDateTime}</b> in room <b>${roomName}</b>.<br><br>
        <b>Invoice details:</b><br>
        - Original price: <b>${totalPrice.toLocaleString()} VND</b><br>
        - ${rankName} discount: <b>-${rankDiscountAmount.toLocaleString()} VND</b><br>
        - Promotion discount (${promotionCode && promotionCode !== "" ? promotionCode : "None"}): <b>-${promotionDiscountAmount.toLocaleString()} VND</b><br>
        -------------------------------------------<br>
        <b>Total: ${finalPrice.toLocaleString()} VND</b> (${paymentMethod}).<br><br>
        Enjoy your movie!
      `;
    } else {
      return `
        Bạn đã đặt vé thành công cho phim <b>${movieTitle}</b> tại rạp <b>${cinemaName}</b>.<br>
        Suất chiếu: <b>${showDateTime}</b> tại phòng <b>${roomName}</b>.<br><br>
        <b>Chi tiết hóa đơn:</b><br>
        - Tổng giá gốc: <b>${totalPrice.toLocaleString()} VNĐ</b><br>
        - Giảm giá hạng ${rankName}: <b>-${rankDiscountAmount.toLocaleString()} VNĐ</b><br>
        - Giảm giá khuyến mãi (${promotionCode && promotionCode !== "" ? promotionCode : "Không có"}): <b>-${promotionDiscountAmount.toLocaleString()} VNĐ</b><br>
        -------------------------------------------<br>
        <b>Thành tiền: ${finalPrice.toLocaleString()} VNĐ</b> (${paymentMethod}).<br><br>
        Chúc bạn xem phim vui vẻ!
      `;
    }
  }

  // ========== REFUND TEMPLATES ==========

  getRefundTitle(language: string): string {
    return language.toLowerCase() === "en"
      ? "Refund / Ticket Cancellation Notice"
      : "Thông báo hoàn tiền / Hủy vé";
  }

  getRefundVoucherMessage(
    language: string,
    bookingId: string,
    refundedValue: number,
    reason: string
  ): string {
    if (language.toLowerCase() === "en") {
      return `Your ticket for order ${bookingId} has been successfully refunded as a Voucher worth ${refundedValue.toLocaleString()} VND. Reason: ${reason}`;
    } else {
      return `Vé cho đơn hàng ${bookingId} đã được hoàn tiền thành công dưới dạng Voucher trị giá ${refundedValue.toLocaleString()} VNĐ. Lý do: ${reason}`;
    }
  }

  getRefundCashMessage(language: string, bookingId: string, reason: string): string {
    if (language.toLowerCase() === "en") {
      return `Your ticket for order ${bookingId} has been cancelled. Please contact the ticket counter for refund. Reason: ${reason}`;
    } else {
      return `Vé cho đơn hàng ${bookingId} đã bị hủy. Vui lòng liên hệ quầy vé để nhận hoàn tiền. Lý do: ${reason}`;
    }
  }

  // ========== DEFAULT TEMPLATES ==========

  getDefaultTitle(language: string): string {
    return language.toLowerCase() === "en"
      ? "Notification from CineHub"
      : "Thông báo từ CineHub";
  }
}
