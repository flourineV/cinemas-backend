import amqp, { connect } from "amqplib";
import { NotificationService } from "../services/NotificationService.js";
import type { BookingTicketGeneratedEvent } from "../events/BookingTicketGeneratedEvent.js";
import type { BookingRefundedEvent } from "../events/BookingRefundedEvent.js";
import type { FnbOrderConfirmedEvent } from "../events/FnbOrderConfirmedEvent.js";
import { RabbitConfig } from "../config/rabbitConfig.js";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>;
type AmqpChannel = Awaited<ReturnType<AmqpConnection["createChannel"]>>;

async function createRabbitConnection(url: string, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await connect(url);
      console.log("[RabbitMQ] ✅ Connected");
      return conn;
    } catch (err: any) {
      console.warn(`[RabbitMQ] ❌ ${url} Connection attempt ${i + 1} failed:`, err.message);
      if (i === retries - 1) throw err;
      await new Promise((r) => setTimeout(r, delay));
    }
  }
  throw new Error("RabbitMQ connection failed after retries");
}
export class NotificationConsumer {
  private connection!: AmqpConnection;
  private channel!: AmqpChannel;
  private notificationService: NotificationService;

  constructor(notificationService: NotificationService) {
    this.notificationService = notificationService;
  }

  async init(): Promise<void> {
    const rabbitUrl = process.env.RABBIT_URL || "amqp://localhost:5672";
    this.connection = await createRabbitConnection(rabbitUrl);
    this.channel = await this.connection.createChannel();

    // assert queue and exchanges
    await this.channel.assertQueue(RabbitConfig.NOTIFICATION_QUEUE, { durable: true });
    await this.channel.assertExchange(RabbitConfig.BOOKING_EXCHANGE, "direct", { durable: true });
    await this.channel.assertExchange(RabbitConfig.FNB_EXCHANGE, "topic", { durable: true });

    // bindings
    await this.channel.bindQueue(
      RabbitConfig.NOTIFICATION_QUEUE,
      RabbitConfig.BOOKING_EXCHANGE,
      RabbitConfig.BOOKING_TICKET_GENERATED_KEY
    );
    await this.channel.bindQueue(
      RabbitConfig.NOTIFICATION_QUEUE,
      RabbitConfig.BOOKING_EXCHANGE,
      RabbitConfig.BOOKING_REFUND_PROCESSED_KEY
    );
    await this.channel.bindQueue(
      RabbitConfig.NOTIFICATION_QUEUE,
      RabbitConfig.FNB_EXCHANGE,
      RabbitConfig.FNB_ORDER_CONFIRMED_KEY
    );

    console.info(`[NotificationConsumer] Listening on queue: ${RabbitConfig.NOTIFICATION_QUEUE}`);

    this.channel.consume(
      RabbitConfig.NOTIFICATION_QUEUE,
      async (msg) => {
        if (!msg) return;
        try {
          const routingKey = msg.fields.routingKey;
          const raw = JSON.parse(msg.content.toString());
          const dataObj = raw.data;

          console.info(`[NotificationConsumer] Received unified event | RoutingKey: ${routingKey}`);

          switch (routingKey) {
            case RabbitConfig.BOOKING_TICKET_GENERATED_KEY: {
              const event: BookingTicketGeneratedEvent = dataObj;
              console.info(`[NotificationConsumer] Processing BookingTicketGeneratedEvent | bookingId=${event.bookingId}`);
              await this.notificationService.sendSuccessBookingTicketNotification(event);
              break;
            }
            case RabbitConfig.BOOKING_REFUND_PROCESSED_KEY: {
              const event: BookingRefundedEvent = dataObj;
              console.info(`[NotificationConsumer] Processing BookingRefundedEvent | bookingId=${event.bookingId}`);
              await this.notificationService.sendBookingRefundProcessedNotification(event);
              break;
            }
            case RabbitConfig.FNB_ORDER_CONFIRMED_KEY: {
              const event: FnbOrderConfirmedEvent = dataObj;
              console.info(`[NotificationConsumer] Processing FnbOrderConfirmedEvent | orderCode=${event.orderCode}`);
              await this.notificationService.sendFnbOrderConfirmationEmailFromEvent(event);
              break;
            }
            default:
              console.warn(`[NotificationConsumer] Received event with unknown RoutingKey: ${routingKey}`);
          }

          this.channel.ack(msg);
        } catch (err: any) {
          console.error(`[NotificationConsumer] ❌ Critical error during event processing:`, err);
          this.channel.nack(msg, false, false);
        }
      },
      { noAck: false }
    );
  }
}
