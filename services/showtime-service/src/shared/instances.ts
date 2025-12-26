import { createClient } from "redis";
import { createServer } from "http";
import { SeatLockWebSocketHandler } from "../websocket/SeatLockWebSocketHandler.js";
import { ShowtimeProducer } from "../producer/ShowtimeProducer.js";

// Create HTTP server for WebSocket
export const server = createServer();

// Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redisClient.on('error', (err) => console.error('❌ Redis Client Error:', err));
redisClient.on('connect', () => console.log('✅ Redis connected'));

// RabbitMQ Producer
export const showtimeProducer = new ShowtimeProducer(
  process.env.RABBITMQ_URL || "amqp://localhost"
);

// WebSocket Handler
export const seatLockWebSocketHandler = new SeatLockWebSocketHandler(server);

// Initialize Redis connection
export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    console.log("✅ Redis connection established!");
  }
};