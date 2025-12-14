import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middlewares/errorHandler";
import { JwtMiddleware } from "./middlewares/JwtMiddleware";
import cookieParser from "cookie-parser";
import { FnbProducer } from "./producers/FnbProducer";
import { FnbConsumer } from "./consumers/FnbConsumer";
import { FnbOrderRepository } from "./repositories/FnbOrderRepository";
import { FnbItemRepository } from "./repositories/FnbItemRepository";
import { RabbitMQSetup } from "./config/rabbitmq.config";

const app = express();

// Initialize RabbitMQ components
export let fnbProducer: FnbProducer;
let fnbConsumer: FnbConsumer;

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Database connection
AppDataSource.initialize()
  .then(async () => {
    console.log("✅ Database connected successfully");

    // Setup RabbitMQ Exchange, Queues and Bindings
    const rabbitMQSetup = new RabbitMQSetup();
    await rabbitMQSetup.connect();
    await rabbitMQSetup.setupAll();
    // ❌ Không disconnect ngay, để Producer/Consumer dùng cùng connection

    // Initialize repositories
    const fnbOrderRepository = new FnbOrderRepository(AppDataSource);
    const fnbItemRepository = new FnbItemRepository(AppDataSource);

    // Initialize RabbitMQ Producer
    fnbProducer = new FnbProducer();
    await fnbProducer.connect();

    // Initialize RabbitMQ Consumer
    fnbConsumer = new FnbConsumer(
      fnbOrderRepository,
      fnbItemRepository,
      fnbProducer
    );
    await fnbConsumer.connect();
  })
  .catch((error) => {
    console.error("❌ Error connecting to database. Details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    process.exit(1);
  });

// Graceful shutdown
process.on("SIGINT", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  if (fnbProducer) await fnbProducer.disconnect();
  if (fnbConsumer) await fnbConsumer.disconnect();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("\n🛑 Shutting down gracefully...");
  if (fnbProducer) await fnbProducer.disconnect();
  if (fnbConsumer) await fnbConsumer.disconnect();
  process.exit(0);
});

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "FNB Service",
    timestamp: new Date().toISOString(),
  });
});

// Routes (mở lại khi có fnbRoutes)
// app.use("/api/fnb", JwtMiddleware(process.env.APP_JWT_SECRET!), fnbRoutes);

// Error handling middleware
app.use(errorHandler);

export default app;
