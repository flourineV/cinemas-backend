import amqp from 'amqplib';
import type { Channel, Connection } from 'amqplib'
import { v4 as uuidv4 } from 'uuid';
import type { EventMessage } from '../events/EventMessage.js';
import type { PaymentBookingFailedEvent } from '../events/PaymentBookingFailedEvent.js';
import type { PaymentBookingSuccessEvent } from '../events/PaymentBookingSuccessEvent';
import type { PaymentFnbFailedEvent } from '../events/PaymentFnbFailedEvent';
import type { PaymentFnbSuccessEvent } from '../events/PaymentFnbSuccessEvent';

// RabbitMQ Configuration Constants
const PAYMENT_EXCHANGE = 'payment.exchange';
const FNB_EXCHANGE = 'fnb.exchange';
const PAYMENT_BOOKING_SUCCESS_KEY = 'payment.booking.success';
const PAYMENT_BOOKING_FAILED_KEY = 'payment.booking.failed';
const PAYMENT_FNB_SUCCESS_KEY = 'payment.fnb.success';
const PAYMENT_FNB_FAILED_KEY = 'payment.fnb.failed';

export class PaymentProducer {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly rabbitUrl: string;

  constructor() {
    this.rabbitUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  /**
   * Initialize RabbitMQ connection and channel
   */
  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.rabbitUrl);
      this.channel = await this.connection.createChannel();

      // Declare exchanges
      await this.channel.assertExchange(PAYMENT_EXCHANGE, 'topic', { durable: true });
      await this.channel.assertExchange(FNB_EXCHANGE, 'topic', { durable: true });

      console.log('[PaymentProducer] Connected to RabbitMQ successfully');

      // Handle connection errors
      this.connection.on('error', (err) => {
        console.error('[PaymentProducer] Connection error:', err);
      });

      this.connection.on('close', () => {
        console.warn('[PaymentProducer] Connection closed');
      });
    } catch (error) {
      console.error('[PaymentProducer] Failed to connect to RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Ensure channel is available
   */
  private async ensureChannel(): Promise<Channel> {
    if (!this.channel) {
      await this.connect();
    }
    return this.channel!;
  }

  /**
   * Send message to RabbitMQ
   */
  private async sendMessage<T>(
    exchange: string,
    routingKey: string,
    message: EventMessage<T>
  ): Promise<void> {
    const channel = await this.ensureChannel();
    
    const messageBuffer = Buffer.from(JSON.stringify(message));
    
    channel.publish(exchange, routingKey, messageBuffer, {
      persistent: true,
      contentType: 'application/json',
      timestamp: Date.now()
    });
  }

  /**
   * Send PaymentBookingSuccess event to BookingService
   */
  async sendPaymentBookingSuccessEvent(data: PaymentBookingSuccessEvent): Promise<void> {
    const message: EventMessage<PaymentBookingSuccessEvent> = {
      eventId: uuidv4(),
      type: 'PaymentBookingSuccess',
      version: 'v1',
      occurredAt: new Date(),
      data
    };

    console.log(
      `[PaymentProducer] Sending PaymentBookingSuccessEvent → BookingService | exchange=${PAYMENT_EXCHANGE}, routingKey=${PAYMENT_BOOKING_SUCCESS_KEY}, bookingId=${data.bookingId}`
    );

    await this.sendMessage(PAYMENT_EXCHANGE, PAYMENT_BOOKING_SUCCESS_KEY, message);
  }

  /**
   * Send PaymentBookingFailed event to BookingService
   */
  async sendPaymentBookingFailedEvent(data: PaymentBookingFailedEvent): Promise<void> {
    const message: EventMessage<PaymentBookingFailedEvent> = {
      eventId: uuidv4(),
      type: 'PaymentFailed',
      version: 'v1',
      occurredAt: new Date(),
      data
    };

    console.error(
      `[PaymentProducer] Sending PaymentFailedEvent → BookingService | exchange=${PAYMENT_EXCHANGE}, routingKey=${PAYMENT_BOOKING_FAILED_KEY}, bookingId=${data.bookingId}`
    );

    await this.sendMessage(PAYMENT_EXCHANGE, PAYMENT_BOOKING_FAILED_KEY, message);
  }

  /**
   * Send PaymentFnbSuccess event to FnbService
   */
  async sendPaymentFnbSuccessEvent(data: PaymentFnbSuccessEvent): Promise<void> {
    const message: EventMessage<PaymentFnbSuccessEvent> = {
      eventId: uuidv4(),
      type: 'PaymentFnbSuccess',
      version: 'v1',
      occurredAt: new Date(),
      data
    };

    console.log(
      `[PaymentProducer] Sending PaymentFnbSuccessEvent → FnbService | fnbOrderId=${data.fnbOrderId}`
    );

    await this.sendMessage(FNB_EXCHANGE, PAYMENT_FNB_SUCCESS_KEY, message);
  }

  /**
   * Send PaymentFnbFailed event to FnbService
   */
  async sendPaymentFnbFailedEvent(data: PaymentFnbFailedEvent): Promise<void> {
    const message: EventMessage<PaymentFnbFailedEvent> = {
      eventId: uuidv4(),
      type: 'PaymentFnbFailed',
      version: 'v1',
      occurredAt: new Date(),
      data
    };

    console.log(
      `[PaymentProducer] Sending PaymentFnbFailedEvent → FnbService | fnbOrderId=${data.fnbOrderId}`
    );

    await this.sendMessage(FNB_EXCHANGE, PAYMENT_FNB_FAILED_KEY, message);
  }

  /**
   * Close RabbitMQ connection gracefully
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('[PaymentProducer] Connection closed successfully');
    } catch (error) {
      console.error('[PaymentProducer] Error closing connection:', error);
    }
  }
}

export default PaymentProducer;