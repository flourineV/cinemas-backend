import amqp, { Connection, Channel, ConsumeMessage } from "amqplib";
import { RabbitConfig } from "../config/rabbitmq.config";
import { PaymentFnbSuccessEvent } from "../events/PaymentFnbSuccessEvent";
import { FnbOrderRepository } from "../repositories/FnbOrderRepository";
import { FnbItemRepository } from "../repositories/FnbItemRepository";
import { FnbOrderStatus } from "../models/FnbOrderStatus.entity";
import { FnbProducer } from "../producers/FnbProducer";
import { FnbOrderConfirmedEvent } from "../events/FnbOrderConfirmedEvent";

export class FnbConsumer {
  private channel: Channel | null = null;
  private connection: Connection | null = null;
  private fnbOrderRepository: FnbOrderRepository;
  private fnbItemRepository: FnbItemRepository;
  private fnbProducer: FnbProducer;

  constructor(
    fnbOrderRepository: FnbOrderRepository,
    fnbItemRepository: FnbItemRepository,
    fnbProducer: FnbProducer
  ) {
    this.fnbOrderRepository = fnbOrderRepository;
    this.fnbItemRepository = fnbItemRepository;
    this.fnbProducer = fnbProducer;
  }

  async connect(): Promise<void> {
    try {
      const conn = await amqp.connect(RabbitConfig.RABBITMQ_URL);
      this.connection = conn as unknown as Connection;

      const ch = await conn.createChannel();
      this.channel = ch as unknown as Channel;

      // Declare exchange
      await this.channel.assertExchange(RabbitConfig.FNB_EXCHANGE, "topic", {
        durable: true,
      });

      // Declare and bind FNB queue
      await this.channel.assertQueue(RabbitConfig.FNB_QUEUE, { durable: true });
      await this.channel.bindQueue(
        RabbitConfig.FNB_QUEUE,
        RabbitConfig.FNB_EXCHANGE,
        RabbitConfig.PAYMENT_FNB_SUCCESS_KEY
      );

      console.log("✅ FnbConsumer connected to RabbitMQ");

      // Start consuming
      await this.startConsuming();
    } catch (error) {
      console.error("❌ Failed to connect FnbConsumer to RabbitMQ:", error);
      throw error;
    }
  }

  private async startConsuming(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.consume(
      RabbitConfig.FNB_QUEUE,
      async (msg: ConsumeMessage | null) => {
        if (!msg) {
          return;
        }

        try {
          const routingKey = msg.fields.routingKey;
          const content = JSON.parse(msg.content.toString());

          console.log(
            `[FnbConsumer] Received event | RoutingKey: ${routingKey}`
          );

          await this.handlePaymentEvents(content, routingKey);

          // Acknowledge message
          this.channel!.ack(msg);
        } catch (error) {
          console.error(
            `[FnbConsumer] Error processing message: ${error}`,
            error
          );
          // Reject and requeue on error
          this.channel!.nack(msg, false, true);
        }
      },
      { noAck: false }
    );

    console.log(`✅ FnbConsumer listening on queue: ${RabbitConfig.FNB_QUEUE}`);
  }

  private async handlePaymentEvents(
    content: any,
    routingKey: string
  ): Promise<void> {
    try {
      if (routingKey === RabbitConfig.PAYMENT_FNB_SUCCESS_KEY) {
        const data: PaymentFnbSuccessEvent = content.data;

        const fnbOrderId = data.fnbOrderId;
        const paymentId = data.paymentId;

        console.log(
          `[FnbConsumer] Processing PaymentSuccess | fnbOrderId=${fnbOrderId}`
        );

        const order = await this.fnbOrderRepository.findById(fnbOrderId);

        if (!order) {
          console.warn(`⚠️ FnbOrder ${fnbOrderId} not found`);
          return;
        }

        // Update order status
        order.status = FnbOrderStatus.PAID;
        order.paymentId = paymentId;
        order.paymentMethod = data.method;
        await this.fnbOrderRepository.save(order);

        console.log(`✅ FnbOrder ${fnbOrderId} confirmed after payment`);

        // Send confirmation event
        await this.sendOrderConfirmationEmail(order);
      } else {
        console.warn(`Unknown routing key: ${routingKey}`);
      }
    } catch (error) {
      console.error(
        `Error processing payment event for RK ${routingKey}: ${error}`,
        error
      );
      throw error;
    }
  }

  private async sendOrderConfirmationEmail(order: any): Promise<void> {
    try {
      // Build FnB items details
      const itemDetails: FnbOrderConfirmedEvent["items"] = [];

      for (const orderItem of order.items || []) {
        const fnbItem = await this.fnbItemRepository.findById(
          orderItem.fnbItemId
        );

        if (fnbItem) {
          itemDetails.push({
            name: fnbItem.name,
            quantity: orderItem.quantity,
            unitPrice: orderItem.unitPrice,
            totalPrice: orderItem.totalPrice,
          });
        }
      }

      // Send event to notification service
      const event: FnbOrderConfirmedEvent = {
        fnbOrderId: order.id,
        userId: order.userId,
        orderCode: order.orderCode,
        totalAmount: order.totalAmount,
        items: itemDetails,
      };

      await this.fnbProducer.sendFnbOrderConfirmedEvent(event);

      console.log(
        `📧 FnB order confirmation event sent for orderCode: ${order.orderCode}`
      );
    } catch (error) {
      console.error(
        `Failed to send FnB order confirmation event: ${error}`,
        error
      );
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      console.log("✅ FnbConsumer disconnected from RabbitMQ");
    } catch (error) {
      console.error("❌ Error disconnecting FnbConsumer:", error);
    }
  }
}
