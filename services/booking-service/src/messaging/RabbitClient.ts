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

async function connectWithRetry(url: string, retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await amqp.connect(url);
      console.log(`[RabbitMQ] ✅ Connected on attempt ${i + 1}`);
      return conn;
    } catch (err: any) {
      console.warn(`[RabbitMQ] ❌ Attempt ${i + 1} failed: ${err.message}`);
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error("RabbitMQ connection failed after retries");
}

export async function initRabbit(url: string = RABBIT_URL) {
    connection = await connectWithRetry(url);
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

export async function getConnection(url: string = RABBIT_URL) {
  if (!connection) {
    connection = await connect(url);
    connection.on("close", () => { connection = null; });
    connection.on("error", (err) => console.error("RabbitMQ error:", err));
  }
  return connection;
}

export async function createChannel(): Promise<AmqpChannel> {
  const conn = await getConnection();
  return conn.createChannel();
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

