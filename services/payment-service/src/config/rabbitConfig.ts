import amqp, {connect} from 'amqplib';
import type {Channel, Options } from 'amqplib';

export const BOOKING_EXCHANGE = 'booking.exchange';
export const SHOWTIME_EXCHANGE = 'showtime.exchange';
export const FNB_EXCHANGE = 'fnb.exchange';
export const PAYMENT_EXCHANGE = 'payment.exchange';

export const BOOKING_CREATED_KEY = 'booking.created';
export const BOOKING_FINALIZED_KEY = 'booking.finalized';
export const SEAT_UNLOCK_ROUTING_KEY = 'seat.unlocked';
export const FNB_ORDER_CREATED_KEY = 'fnb.order.created';

export const PAYMENT_BOOKING_SUCCESS_KEY = 'payment.booking.success';
export const PAYMENT_BOOKING_FAILED_KEY = 'payment.booking.failed';
export const PAYMENT_FNB_SUCCESS_KEY = 'payment.fnb.success';
export const PAYMENT_FNB_FAILED_KEY = 'payment.fnb.failed';

export const PAYMENT_QUEUE = 'payment.queue';

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>; 
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;
let connection: AmqpConnection;
let channel: AmqpChannel;

export async function connectRabbitMQ(url: string) {
    connection = await connect(url);
    channel = await connection.createChannel();

    // Declare exchanges
    await channel.assertExchange(BOOKING_EXCHANGE, 'direct', { durable: true });
    await channel.assertExchange(SHOWTIME_EXCHANGE, 'direct', { durable: true });
    await channel.assertExchange(FNB_EXCHANGE, 'topic', { durable: true });
    await channel.assertExchange(PAYMENT_EXCHANGE, 'direct', { durable: true });

    // Declare queue
    await channel.assertQueue(PAYMENT_QUEUE, { durable: true });

    // Bindings
    await channel.bindQueue(PAYMENT_QUEUE, BOOKING_EXCHANGE, BOOKING_CREATED_KEY);
    await channel.bindQueue(PAYMENT_QUEUE, BOOKING_EXCHANGE, BOOKING_FINALIZED_KEY);
    await channel.bindQueue(PAYMENT_QUEUE, SHOWTIME_EXCHANGE, SEAT_UNLOCK_ROUTING_KEY);
    await channel.bindQueue(PAYMENT_QUEUE, FNB_EXCHANGE, FNB_ORDER_CREATED_KEY);

    console.log('RabbitMQ connected and exchanges/queues bound.');
}

export function getChannel(): Channel {
    if (!channel) throw new Error('RabbitMQ channel is not initialized. Call connectRabbitMQ first.');
    return channel;
}

// Publish message utility
export async function publish(
    exchange: string,
    routingKey: string,
    message: any,
    options?: Options.Publish
) {
    const buffer = Buffer.from(JSON.stringify(message));
    return getChannel().publish(exchange, routingKey, buffer, options);
}

// Consume message utility
export async function consume(queue: string, callback: (msg: any) => void) {
    await getChannel().consume(queue, (msg) => {
        if (msg) {
            const content = JSON.parse(msg.content.toString());
            callback(content);
            getChannel().ack(msg);
        }
    });
}
