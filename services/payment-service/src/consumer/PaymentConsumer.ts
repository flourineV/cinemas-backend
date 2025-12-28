import {
  getChannel,
  PAYMENT_QUEUE,
  BOOKING_CREATED_KEY,
  BOOKING_FINALIZED_KEY,
  SEAT_UNLOCK_ROUTING_KEY,
  FNB_ORDER_CREATED_KEY,
} from "../config/rabbitConfig.js";
import { PaymentService } from "../services/PaymentService.js";
import type { BookingCreatedEvent } from "../events/BookingCreatedEvent.js";
import type { BookingFinalizedEvent } from "../events/BookingFinalizedEvent.js";
import type { SeatUnlockedEvent } from "../events/SeatUnlockedEvent.js";
import type { FnbOrderCreatedEvent } from "../events/FnbOrderCreatedEvent.js";
import type { ConsumeMessage } from "amqplib";
export class PaymentConsumer {
  private paymentService: PaymentService;

  constructor(paymentService: PaymentService) {
    this.paymentService = paymentService;
  }

  public async startConsuming() {
    const channel = getChannel();

    await channel.consume(PAYMENT_QUEUE, async (msg: ConsumeMessage | null) => {
      if (!msg) return;

      try {
        const content = JSON.parse(msg.content.toString());
        const routingKey = msg.fields.routingKey;

        console.log(
          `[PaymentConsumer] Received event | RoutingKey: ${routingKey}`
        );

        const dataObj = content.data;

        switch (routingKey) {
          case BOOKING_CREATED_KEY: {
            const event: BookingCreatedEvent = dataObj as BookingCreatedEvent;
            console.log(
              `[PaymentConsumer] Processing BookingCreatedEvent | bookingId=${event.bookingId}`
            );
            await this.paymentService.createPendingTransaction(event);
            break;
          }

          case BOOKING_FINALIZED_KEY: {
            const event: BookingFinalizedEvent =
              dataObj as BookingFinalizedEvent;
            console.log(
              `[PaymentConsumer] Processing BookingFinalizedEvent | bookingId=${event.bookingId} | finalPrice=${event.finalPrice}`
            );
            await this.paymentService.updateFinalAmount(event);
            break;
          }

          case SEAT_UNLOCK_ROUTING_KEY: {
            const event: SeatUnlockedEvent = dataObj as SeatUnlockedEvent;
            console.log(
              `[PaymentConsumer] Processing SeatUnlockedEvent | bookingId=${event.bookingId} | showtimeId=${event.showtimeId} | seatIds=${event.seatIds}`
            );
            await this.paymentService.updateStatus(event);
            break;
          }

          case FNB_ORDER_CREATED_KEY: {
            const event: FnbOrderCreatedEvent = dataObj as FnbOrderCreatedEvent;
            console.log(
              `[PaymentConsumer] Processing FnbOrderCreatedEvent | fnbOrderId=${event.fnbOrderId} | total=${event.totalAmount}`
            );
            await this.paymentService.createPendingTransactionForFnb(event);
            break;
          }

          default: {
            console.warn(
              `[PaymentConsumer] Unknown routing key: ${routingKey}`
            );
            break;
          }
        }

        channel.ack(msg);
      } catch (err) {
        console.error(
          `[PaymentConsumer] Error processing message: ${
            (err as Error).message
          }`,
          err
        );
        // Optionally: channel.nack(msg, false, false); // discard or requeue based on strategy
      }
    });

    console.log("[PaymentConsumer] Started consuming payment queue");
  }
}
