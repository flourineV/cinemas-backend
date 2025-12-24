import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer"
import path from "path";
import fs from "fs";
import handlebars from "handlebars";
import { PromotionEmailData } from "../dto/email/PromotionEmailData.js";
import type { SeatDetail } from "../dto/external/SeatDetail.js";
import type { FnbDetail } from "../dto/external/FnbDetail.js";
import type { PromotionDetail } from "../dto/external/PromotionDetail.js";
import { FnbOrderConfirmationRequest } from "../dto/request/FnbOrderConfirmationRequest.js";

export class EmailService {
    private transporter: Transporter;
    private adminEmail: string;

    constructor() {
        this.transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        });

        this.adminEmail = process.env.ADMIN_EMAIL || "admin@cinehub.com";
    }

    private renderTemplate(templateName: string, context: any): string {
        const filePath = path.join(__dirname, "..", "templates", `${templateName}.hbs`);
        const source = fs.readFileSync(filePath, "utf8");
        const template = handlebars.compile(source);
        return template(context);
    }

    async sendRefundEmail(
        to: string,
        userName: string,
        bookingId: string,
        refundAmount: number,
        refundMethod: string, // "VOUCHER" or "COUNTER"
        reason: string
    ): Promise<void> {
        const html = this.renderTemplate("booking-refund", {
        userName,
        bookingId,
        refundAmount,
        reason,
        isVoucher: refundMethod.toUpperCase() === "VOUCHER",
        isCounter: refundMethod.toUpperCase() === "COUNTER",
        });

        await this.transporter.sendMail({
        from: this.adminEmail,
        to,
        subject: "CineHub – Thông báo hoàn tiền / Hủy vé",
        html,
        });
        console.log(`Refund email sent to ${to}`);
    }

    async sendBookingTicketEmail(
        to: string,
        userName: string,
        bookingId: string,
        bookingCode: string,
        movieTitle: string,
        cinemaName: string,
        roomName: string,
        showDateTime: string,
        seats: SeatDetail[],
        fnbs: FnbDetail[],
        promotion: PromotionDetail | null,
        rankName: string | null,
        rankDiscountAmount: number | null,
        totalPrice: number,
        finalPrice: number,
        paymentMethod: string
    ): Promise<void> {
        const html = this.renderTemplate("booking-ticket", {
        userName,
        bookingCode,
        movieTitle,
        cinemaName,
        roomName,
        showDateTime,
        paymentMethod,
        seats,
        fnbs,
        rankName: rankName || "Chưa có hạng",
        rankDiscountAmount: rankDiscountAmount || 0,
        promotionCode: promotion ? promotion.code : null,
        promotionDiscount: promotion ? promotion.discountAmount : 0,
        totalPrice,
        finalPrice,
        });

        await this.transporter.sendMail({
        from: this.adminEmail,
        to,
        subject: "CineHub – Vé xem phim của bạn đã sẵn sàng",
        html,
        attachments: [
            {
            filename: "LogoFullfinal.png",
            path: path.join(__dirname, "..", "templates", "mail", "LogoFullfinal.png"),
            cid: "logoImage",
            },
        ],
        });
        console.log(`Booking ticket email sent to ${to}`);
    }

    async sendPromotionEmail(
        to: string,
        promotionCode: string,
        discountType: string,
        discountValue: number,
        discountValueDisplay: string,
        description: string,
        promoDisplayUrl: string,
        startDate: Date,
        endDate: Date,
        usageRestriction: string,
        actionUrl: string | null,
        isOneTimeUse: boolean
    ): Promise<void> {
        const promotion = new PromotionEmailData(
        promotionCode,
        description,
        discountValue,
        startDate,
        endDate,
        isOneTimeUse,
        discountType
        );

        const html = this.renderTemplate("promotion", {
        name: "Quý khách",
        promotion,
        discountValueDisplay,
        promoDisplayUrl,
        usageRestriction,
        actionUrl: actionUrl || "https://cinehub.com",
        });

        await this.transporter.sendMail({
        from: this.adminEmail,
        to,
        subject: "CineHub - Ưu đãi đặc biệt dành cho bạn",
        html,
        });
        console.log(`Promotion email sent to ${to}`);
    }

    async sendContactEmail(name: string, email: string, messageContent: string): Promise<void> {
        const emailBody = `CineHub Contact Form Submission\n\nName: ${name}\nEmail: ${email}\nMessage:\n${messageContent}\n\nReceived at: ${new Date().toLocaleString("vi-VN")}`;

        await this.transporter.sendMail({
        from: this.adminEmail,
        to: this.adminEmail,
        subject: `CineHub - Contact Form: ${name}`,
        replyTo: email,
        text: emailBody,
        });
        console.log(`Contact email sent from ${name} (${email})`);
    }

    async sendFnbOrderConfirmationEmail(
        to: string,
        userName: string,
        orderCode: string,
        totalAmount: number,
        items: FnbOrderConfirmationRequest["items"]
    ): Promise<void> {
        const html = this.renderTemplate("fnb-order-confirmation", {
        userName,
        orderCode,
        totalAmount,
        items,
        });

        await this.transporter.sendMail({
        from: this.adminEmail,
        to,
        subject: `CineHub - Xác nhận đơn hàng bắp nước #${orderCode}`,
        html,
        });
        console.log(`FnB order confirmation email sent to ${to}`);
    }
}
