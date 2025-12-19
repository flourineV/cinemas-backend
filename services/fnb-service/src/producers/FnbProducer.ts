import amqp, { Connection, Channel } from "amqplib";
import { RabbitConfig } from "../config/rabbitmq.config";
import { EventMessage } from "../events/EventMessage";
import { FnbOrderCreatedEvent } from "../events/FnbOrderCreatedEvent";
import { FnbOrderConfirmedEvent } from "../events/FnbOrderConfirmedEvent";

export class FnbProducer {
  private channel: Channel | null = null;
  private connection: Connection | null = null;

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

      console.log("✅ FnbProducer connected to RabbitMQ");
    } catch (error) {
      console.error("❌ Failed to connect FnbProducer to RabbitMQ:", error);
      throw error;
    }
  }

  async sendFnbOrderCreatedEvent(event: FnbOrderCreatedEvent): Promise<void> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const message = new EventMessage<FnbOrderCreatedEvent>(
        "FNB_ORDER_CREATED",
        event
      );

      const messageBuffer = Buffer.from(JSON.stringify(message));

      await this.channel!.publish(
        RabbitConfig.FNB_EXCHANGE,
        RabbitConfig.FNB_ORDER_CREATED_KEY,
        messageBuffer,
        { persistent: true }
      );

      console.log(
        `✅ Sent FnbOrderCreatedEvent | fnbOrderId=${event.fnbOrderId}`
      );
    } catch (error) {
      console.error("❌ Failed to send FnbOrderCreatedEvent:", error);
      throw error;
    }
  }

  async sendFnbOrderConfirmedEvent(
    event: FnbOrderConfirmedEvent
  ): Promise<void> {
    try {
      if (!this.channel) {
        await this.connect();
      }

      const message = new EventMessage<FnbOrderConfirmedEvent>(
        "FNB_ORDER_CONFIRMED",
        event
      );

      const messageBuffer = Buffer.from(JSON.stringify(message));

      await this.channel!.publish(
        RabbitConfig.FNB_EXCHANGE,
        RabbitConfig.FNB_ORDER_CONFIRMED_KEY,
        messageBuffer,
        { persistent: true }
      );

      console.log(
        `✅ Sent FnbOrderConfirmedEvent | orderCode=${event.orderCode}`
      );
    } catch (error) {
      console.error("❌ Failed to send FnbOrderConfirmedEvent:", error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await (this.connection as any).close();
        this.connection = null;
      }
      if (this.channel) {
        this.channel = null;
      }
      console.log("✅ FnbProducer disconnected from RabbitMQ");
    } catch (error) {
      console.error("❌ Error disconnecting FnbProducer:", error);
    }
  }
}

