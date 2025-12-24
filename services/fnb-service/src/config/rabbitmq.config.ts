import amqp, { Connection, Channel } from "amqplib";

// RabbitMQ Configuration
export const RabbitConfig = {
  // Exchange
  FNB_EXCHANGE: "fnb.exchange",

  // Routing Keys
  FNB_ORDER_CREATED_KEY: "fnb.order.created",
  FNB_ORDER_CONFIRMED_KEY: "fnb.order.confirmed",
  PAYMENT_FNB_SUCCESS_KEY: "payment.fnb.success",

  // Queues
  PAYMENT_QUEUE: "payment.queue",
  FNB_QUEUE: "fnb.queue",

  // Connection
  RABBITMQ_URL: process.env.RABBITMQ_URL || "amqp://localhost:5672",
};

/**
 * Setup RabbitMQ Exchange, Queues and Bindings
 * Equivalent to Java @Bean methods
 */
export class RabbitMQSetup {
  private channel: Channel | null = null;
  private connection: Connection | null = null;

  async connect(): Promise<void> {
    try {
      const conn = await amqp.connect(RabbitConfig.RABBITMQ_URL);
      this.connection = conn as unknown as Connection;

      const ch = await conn.createChannel();
      this.channel = ch as unknown as Channel;
      console.log("✅ RabbitMQ connection established");
    } catch (error) {
      console.error("❌ Failed to connect to RabbitMQ:", error);
      throw error;
    }
  }

  /**
   * Setup Exchange (equivalent to fnbExchange() @Bean)
   */
  async setupExchange(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.assertExchange(RabbitConfig.FNB_EXCHANGE, "topic", {
      durable: true,
    });
    console.log(`✅ Exchange '${RabbitConfig.FNB_EXCHANGE}' declared`);
  }

  /**
   * Setup FNB Queue (equivalent to fnbQueue() @Bean)
   */
  async setupFnbQueue(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.assertQueue(RabbitConfig.FNB_QUEUE, { durable: true });
    console.log(`✅ Queue '${RabbitConfig.FNB_QUEUE}' declared`);
  }

  /**
   * Setup Payment Queue (equivalent to payment queue in Java)
   */
  async setupPaymentQueue(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.assertQueue(RabbitConfig.PAYMENT_QUEUE, {
      durable: true,
    });
    console.log(`✅ Queue '${RabbitConfig.PAYMENT_QUEUE}' declared`);
  }

  /**
   * Bind Payment Queue to receive FnB events
   * (equivalent to fnbToPaymentBinding() @Bean)
   */
  async bindFnbToPayment(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.bindQueue(
      RabbitConfig.PAYMENT_QUEUE,
      RabbitConfig.FNB_EXCHANGE,
      RabbitConfig.FNB_ORDER_CREATED_KEY
    );
    console.log(
      `✅ Binding: ${RabbitConfig.PAYMENT_QUEUE} -> ${RabbitConfig.FNB_EXCHANGE} (${RabbitConfig.FNB_ORDER_CREATED_KEY})`
    );
  }

  /**
   * Bind FNB Queue to receive payment success events
   * (equivalent to paymentSuccessToFnbBinding() @Bean)
   */
  async bindPaymentSuccessToFnb(): Promise<void> {
    if (!this.channel) {
      throw new Error("Channel not initialized");
    }

    await this.channel.bindQueue(
      RabbitConfig.FNB_QUEUE,
      RabbitConfig.FNB_EXCHANGE,
      RabbitConfig.PAYMENT_FNB_SUCCESS_KEY
    );
    console.log(
      `✅ Binding: ${RabbitConfig.FNB_QUEUE} -> ${RabbitConfig.FNB_EXCHANGE} (${RabbitConfig.PAYMENT_FNB_SUCCESS_KEY})`
    );
  }

  /**
   * Setup all queues and bindings
   */
  async setupAll(): Promise<void> {
    await this.setupExchange();
    await this.setupFnbQueue();
    await this.setupPaymentQueue();
    await this.bindFnbToPayment();
    await this.bindPaymentSuccessToFnb();
    console.log("✅ All RabbitMQ bindings configured");
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
      console.log("✅ RabbitMQ setup disconnected");
    } catch (error) {
      console.error("❌ Error disconnecting RabbitMQ setup:", error);
    }
  }
}
