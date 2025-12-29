// src/messaging/PaymentProducer.ts
import { v4 as uuidv4 } from "uuid";
import {
  getChannel,
  PAYMENT_EXCHANGE,
  FNB_EXCHANGE,
  PAYMENT_BOOKING_SUCCESS_KEY,
  PAYMENT_BOOKING_FAILED_KEY,
  PAYMENT_FNB_SUCCESS_KEY,
  PAYMENT_FNB_FAILED_KEY,
} from "../config/rabbitConfig.js";

import type { EventMessage } from "../events/EventMessage.js";
import type { PaymentBookingSuccessEvent } from "../events/PaymentBookingSuccessEvent.js";
import type { PaymentBookingFailedEvent } from "../events/PaymentBookingFailedEvent.js";
import type { PaymentFnbSuccessEvent } from "../events/PaymentFnbSuccessEvent.js";
import type { PaymentFnbFailedEvent } from "../events/PaymentFnbFailedEvent.js";

export class PaymentProducer {
  /**
   * Internal helper to publish a message
   */
  private async sendMessage<T>(
    exchange: string,
    routingKey: string,
    message: EventMessage<T>
  ): Promise<void> {
    const channel = getChannel();
    const buffer = Buffer.from(JSON.stringify(message));

    channel.publish(exchange, routingKey, buffer, {
      persistent: true,
      contentType: "application/json",
      timestamp: Date.now(),
    });
  }

  /**
   * Send PaymentBookingSuccess event → BookingService
   */
  async sendPaymentBookingSuccessEvent(
    data: PaymentBookingSuccessEvent
  ): Promise<void> {
    const message: EventMessage<PaymentBookingSuccessEvent> = {
      eventId: uuidv4(),
      type: "PaymentBookingSuccess",
      version: "v1",
      occurredAt: new Date(),
      data,
    };

    console.log(
      `[PaymentProducer] Sending PaymentBookingSuccessEvent → BookingService | bookingId=${data.bookingId}`
    );

    await this.sendMessage(
      PAYMENT_EXCHANGE,
      PAYMENT_BOOKING_SUCCESS_KEY,
      message
    );
  }

  /**
   * Send PaymentBookingFailed event → BookingService
   */
  async sendPaymentBookingFailedEvent(
    data: PaymentBookingFailedEvent
  ): Promise<void> {
    const message: EventMessage<PaymentBookingFailedEvent> = {
      eventId: uuidv4(),
      type: "PaymentBookingFailed",
      version: "v1",
      occurredAt: new Date(),
      data,
    };

    console.log(
      `[PaymentProducer] Sending PaymentBookingFailedEvent → BookingService | bookingId=${data.bookingId}`
    );

    await this.sendMessage(
      PAYMENT_EXCHANGE,
      PAYMENT_BOOKING_FAILED_KEY,
      message
    );
  }

  /**
   * Send PaymentFnbSuccess event → FnbService
   */
  async sendPaymentFnbSuccessEvent(
    data: PaymentFnbSuccessEvent
  ): Promise<void> {
    const message: EventMessage<PaymentFnbSuccessEvent> = {
      eventId: uuidv4(),
      type: "PaymentFnbSuccess",
      version: "v1",
      occurredAt: new Date(),
      data,
    };

    console.log(
      `[PaymentProducer] Sending PaymentFnbSuccessEvent → FnbService | fnbOrderId=${data.fnbOrderId}`
    );

    await this.sendMessage(FNB_EXCHANGE, PAYMENT_FNB_SUCCESS_KEY, message);
  }

  /**
   * Send PaymentFnbFailed event → FnbService
   */
  async sendPaymentFnbFailedEvent(
    data: PaymentFnbFailedEvent
  ): Promise<void> {
    const message: EventMessage<PaymentFnbFailedEvent> = {
      eventId: uuidv4(),
      type: "PaymentFnbFailed",
      version: "v1",
      occurredAt: new Date(),
      data,
    };

    console.log(
      `[PaymentProducer] Sending PaymentFnbFailedEvent → FnbService | fnbOrderId=${data.fnbOrderId}`
    );

    await this.sendMessage(FNB_EXCHANGE, PAYMENT_FNB_FAILED_KEY, message);
  }
}

export default PaymentProducer;
