import { Notification } from "../models/Notification.js";
import { NotificationType } from "../models/NotificationType.js";
import { EmailService } from "./EmailService.js";
import { UserProfileClient } from "../client/UserProfileClient.js";
import { MessageTemplateService } from "./MessageTemplateService.js";
import type { BookingTicketGeneratedEvent } from "../events/BookingTicketGeneratedEvent.js";
import type { BookingRefundedEvent } from "../events/BookingRefundedEvent.js";
import type { FnbOrderConfirmedEvent } from "../events/FnbOrderConfirmedEvent.js";
import { FnbOrderConfirmationRequest } from "../dto/request/FnbOrderConfirmationRequest.js";
import type { NotificationResponse } from "../dto/response/NotificationResponse.js";
import type { PromotionNotificationResponse } from "../dto/response/PromotionNotificationResponse.js";
import type { PromotionNotificationRequest } from "../dto/request/PromotionNotificationRequest.js";
import { DataSource } from "typeorm";
export class NotificationService {
  private notificationRepo = this.dataSource.getRepository(Notification);
  private emailService: EmailService = new EmailService();
  private userProfileClient: UserProfileClient = new UserProfileClient();
  private messageTemplateService: MessageTemplateService = new MessageTemplateService();

  constructor(private dataSource: DataSource) {}

  // ----------------- Booking refund -----------------
  async sendBookingRefundProcessedNotification(event: BookingRefundedEvent): Promise<void> {
    console.info(`Processing BookingRefundedEvent for bookingId=${event.bookingId}`);

    let userEmail: string | undefined;
    let userName: string | undefined;
    const language = event.language ?? "vi";

    if (event.userId) {
      try {
        const profile = await this.userProfileClient.getUserProfile(event.userId);
        if (!profile) {
          console.warn(`Profile not found for userId ${event.userId}`);
          return;
        }
        userEmail = profile.email;
        userName = profile.fullName && profile.fullName.length > 0 ? profile.fullName : profile.username;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return;
      }
    // } else {
    //   userEmail = event.guestEmail ?? undefined;
    //   userName = event.guestName ?? undefined;
    }

    if (!userEmail) {
      console.warn(`No email to send refund notification for booking ${event.bookingId}`);
      return;
    }

    // If user is registered, create notification record
    if (event.userId) {
      const title = this.messageTemplateService.getRefundTitle(language);
      const message =
        (event.refundMethod && event.refundMethod.toUpperCase() === "VOUCHER")
          ? this.messageTemplateService.getRefundVoucherMessage(language, event.bookingId, event.refundedValue, event.reason)
          : this.messageTemplateService.getRefundCashMessage(language, event.bookingId, event.reason);

      try {
        await this.createNotification(
          event.userId,
          event.bookingId,
          null,
          event.refundedValue,
          title,
          message,
          NotificationType.BOOKING_REFUNDED,
          language,
          { reason: event.reason, method: event.refundMethod }
        );
      } catch (err) {
        console.error("Error creating refund notification:", err);
      }
    }

    // Send email to user/guest
    try {
      await this.emailService.sendRefundEmail(
        userEmail,
        userName ?? "Khách hàng",
        event.bookingId,
        event.refundedValue,
        event.refundMethod,
        event.reason
      );
      console.info(`Refund email sent to ${userEmail}`);
    } catch (err) {
      console.error(`Error sending refund email to ${userEmail}:`, err);
      // TODO: push to retry queue
    }
  }

  // ----------------- Booking ticket -----------------
  async sendSuccessBookingTicketNotification(event: BookingTicketGeneratedEvent): Promise<void> {
    console.info(`Received BookingTicketGeneratedEvent for bookingId=${event.bookingId}`);

    let userEmail: string | undefined;
    let userName: string | undefined;
    const language = event.language ?? "vi";

    if (event.userId) {
      try {
        const profile = await this.userProfileClient.getUserProfile(event.userId);
        if (!profile) {
          console.warn(`Profile not found for userId ${event.userId}`);
          return;
        }
        userEmail = profile.email;
        userName = profile.fullName && profile.fullName.length > 0 ? profile.fullName : profile.username;
      } catch (err) {
        console.error("Error fetching user profile:", err);
        return;
      }
    } //else {
    //   userEmail = event.guestEmail ?? undefined;
    //   userName = event.guestName ?? undefined;
    // }

    if (!userEmail) {
      console.warn(`No email to send booking ticket notification for booking ${event.bookingId}`);
      return;
    }

    // Build title and message
    try {
      const title = this.messageTemplateService.getBookingTicketTitle(language);
      const message = this.messageTemplateService.getBookingTicketMessage(
        language,
        event.movieTitle,
        event.cinemaName,
        event.showDateTime,
        event.roomName,
        event.totalPrice,
        event.rankName,
        event.rankDiscountAmount,
        event.promotion ? event.promotion.code : null,
        event.promotion ? event.promotion.discountAmount : 0,
        event.finalPrice,
        event.paymentMethod
      );

      const metadata: Record<string, any> = {
        bookingId: event.bookingId,
        bookingCode: event.bookingCode,
        userId: event.userId,
        movieTitle: event.movieTitle,
        cinemaName: event.cinemaName,
        roomName: event.roomName,
        showDateTime: event.showDateTime,
        seats: event.seats ?? [],
        fnbs: event.fnbs ?? [],
        promotionCode: event.promotion ? event.promotion.code : "",
        rankName: event.rankName,
        rankDiscountAmount: event.rankDiscountAmount,
        totalPrice: event.totalPrice,
        finalPrice: event.finalPrice,
        paymentMethod: event.paymentMethod,
        createdAt: event.createdAt ?? new Date().toISOString()
      };

      const notification = this.notificationRepo.create({
        userId: event.userId,
        title,
        message,
        language,
        type: NotificationType.BOOKING_TICKET,
        metadata
      } as Partial<Notification>);

      await this.notificationRepo.save(notification);
      console.info(`Notification (BOOKING_TICKET) saved for user ${userEmail}`);
    } catch (err) {
      console.error("Error saving booking ticket notification:", err);
    }

    // Send email
    try {
      await this.emailService.sendBookingTicketEmail(
        userEmail,
        userName ?? "Khách hàng",
        event.bookingId,
        event.bookingCode,
        event.movieTitle,
        event.cinemaName,
        event.roomName,
        event.showDateTime,
        event.seats ?? [],
        event.fnbs ?? [],
        event.promotion ?? null,
        event.rankName ?? null,
        event.rankDiscountAmount ?? 0,
        event.totalPrice,
        event.finalPrice,
        event.paymentMethod
      );
      console.info(`Booking ticket email sent to ${userEmail}`);
    } catch (err) {
      console.error(`Error sending booking ticket email to ${userEmail}:`, err);
      // TODO: push to retry queue
    }
  }

  // ----------------- Create notification helper -----------------
  async createNotification(
    userId: string,
    bookingId: string | null,
    paymentId: string | null,
    amount: number | null,
    title: string | null,
    message: string,
    type: NotificationType,
    language: string | null,
    metadata: Record<string, any> | null
  ): Promise<Notification> {
    if (!userId || !type) {
      throw new Error("userId and type must not be null");
    }

    const finalTitle = title ?? this.messageTemplateService.getDefaultTitle(language ?? "vi");

    const notification = this.notificationRepo.create({
      userId,
      bookingId,
      paymentId,
      amount,
      title: finalTitle,
      message,
      type,
      language: language ?? "vi",
      metadata
    } as Partial<Notification>);

    const saved = await this.notificationRepo.save(notification);
    console.info(`[Notification] Created new ${type} for userId=${userId} with title='${saved.title}'`);
    return saved;
  }

  // ----------------- Queries -----------------
  async getByUser(userId: string): Promise<NotificationResponse[]> {
    const rows = await this.notificationRepo.find({ where: { userId }, order: { createdAt: "DESC" } });
    return rows.map(this.toResponse);
  }

  async getAll(): Promise<NotificationResponse[]> {
    const rows = await this.notificationRepo.find({ order: { createdAt: "DESC" } });
    return rows.map(this.toResponse);
  }

  private toResponse(n: Notification): NotificationResponse {
    return {
      id: n.id,
      userId: n.userId,
      ...(n.bookingId && { bookingId: n.bookingId }),
      ...(n.paymentId && { paymentId: n.paymentId }),
      ...(n.amount !== undefined && { amount: n.amount }),
      title: n.title,
      message: n.message,
      type: n.type,
      ...(n.metadata && { metadata: JSON.stringify(n.metadata) }),
      createdAt: n.createdAt
    };
  }

  // ----------------- Promotion notification (broadcast) -----------------
  async createPromotionNotification(request: PromotionNotificationRequest): Promise<PromotionNotificationResponse> {
    console.info(`Sending promotion notification for code: ${request.promotionCode}`);

    let subscribedEmails: string[] = [];
    try {
      subscribedEmails = await this.userProfileClient.getSubscribedUsersEmails();
      console.info(`Found ${subscribedEmails.length} subscribed users for promotion notification`);
    } catch (err) {
      console.error("Error fetching subscribed users:", err);
      // return with zero sent/failed or rethrow depending on desired behavior
    }

    let emailsSent = 0;
    let emailsFailed = 0;

    for (const email of subscribedEmails) {
      try {
        await this.emailService.sendPromotionEmail(
          email,
          request.promotionCode ?? "",
          request.discountType ?? "",
          request.discountValue ?? 0,
          request.discountValueDisplay ?? "",
          request.description ?? "",
          request.promoDisplayUrl ?? "",
          request.startDate ?? new Date(),
          request.endDate ?? new Date(),
          request.usageRestriction ?? "",
          request.actionUrl ?? null,
          request.promotionType === "FIRST_TIME"
        );
        emailsSent++;
      } catch (err) {
        console.error(`Failed to send promotion email to ${email}:`, err);
        emailsFailed++;
      }
    }

    return {
      message: "Promotion notification sent",
      emailsSent,
      emailsFailed,
      promotionCode: request.promotionCode ?? ""
    };
  }

  // ----------------- FnB order confirmation -----------------
  async sendFnbOrderConfirmationEmail(request: FnbOrderConfirmationRequest): Promise<void> {
    console.info(`Sending FnB order confirmation email for orderCode: ${request.orderCode}`);
    try {
      await this.emailService.sendFnbOrderConfirmationEmail(
        request.userEmail,
        request.userName,
        request.orderCode,
        request.totalAmount,
        request.items
      );
      console.info(`FnB order confirmation email sent to: ${request.userEmail}`);
    } catch (err) {
      console.error("Failed to send FnB order confirmation email:", err);
      // TODO: retry logic
    }
  }

  async sendFnbOrderConfirmationEmailFromEvent(event: FnbOrderConfirmedEvent): Promise<void> {
    console.info(`Processing FnbOrderConfirmedEvent for orderCode: ${event.orderCode}`);

    let userEmail = "user@example.com";
    let userName = "Customer";

    try {
      const profile = await this.userProfileClient.getUserProfile(event.userId);
      if (profile) {
        userEmail = profile.email;
        userName = profile.fullName && profile.fullName.length > 0 ? profile.fullName : profile.username;
      } else {
        console.warn(`User profile not found for userId: ${event.userId}, using defaults`);
      }
    } catch (err) {
      console.error(`Failed to fetch user profile for userId ${event.userId}:`, err);
    }

    const emailItems = event.items.map(item => ({
      itemName: item.itemName,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      totalPrice: item.totalPrice
    }));

    try {
      await this.emailService.sendFnbOrderConfirmationEmail(
        userEmail,
        userName,
        event.orderCode,
        event.totalAmount,
        emailItems
      );
      console.info(`FnB order confirmation email sent to: ${userEmail}`);
    } catch (err) {
      console.error("Failed to send FnB order confirmation email:", err);
    }
  }
}
