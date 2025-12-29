import amqp, { connect } from "amqplib";

type AmqpConnection = Awaited<ReturnType<typeof amqp.connect>>; 
type AmqpChannel = Awaited<ReturnType<AmqpConnection['createChannel']>>;
let connection: AmqpConnection | null = null;
let channel: AmqpChannel | null = null;
/**
 * Initialize RabbitMQ connection and channel.
 * Call once at application startup.
 */
const RABBIT_URL = process.env.RABBIT_URL || "amqp://localhost";
export async function initRabbit(url: string = RABBIT_URL) {
    connection = await connect(url);
    channel = await connection.createChannel();
  // optional: confirm channel if you want publisher confirms
  // channel = await connection.createConfirmChannel();

  // Keep process from exiting on connection close
  connection.on('close', (err) => {
    console.warn('RabbitMQ connection closed', err);
    connection = null;
    channel = null;
  });

  connection.on('error', (err) => {
    console.error('RabbitMQ connection error', err);
  });

  return { connection, channel };
}

/**
 * Publish a message to exchange with routing key.
 * Ensures channel is available.
 */
export async function publish(exchange: string, routingKey: string, payload: unknown) {
  if (!channel) {
    throw new Error('RabbitMQ channel is not initialized. Call initRabbit first.');
  }

  // Ensure exchange exists (topic type to allow routing keys)
  await channel.assertExchange(exchange, 'direct', { durable: true });

  const buffer = Buffer.from(JSON.stringify(payload));
  const published = channel.publish(exchange, routingKey, buffer, {
    contentType: 'application/json',
    persistent: true,
  });

  return published;
}
/**
 * Graceful shutdown
 */
export async function closeRabbit(): Promise<void> {
  if (channel) await channel.close();
  if (connection) await connection.close();
  channel = null;
  connection = null;
}