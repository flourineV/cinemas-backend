import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { AppDataSource } from "./data-source.js";
import { createServer } from "http";
//import { requireInternal } from "./middleware/internalAuthChecker.js";
import { middleware } from "./middleware/middleware.js";
import { userContextMiddleware } from "./middleware/userContextMiddleware.js";

// Controllers
import BookingStatsController from "./controllers/BookingStatsController.js";
import BookingController from "./controllers/BookingController.js";
import {startUnifiedEventConsumer} from "./consumer/UnifiedEventConsumer.js";
import { createBookingService, redisClient, bookingProducer} from './shared/instances.js';
import { setupSwagger } from "./config/swagger.js";
import { initRabbit } from "./messaging/RabbitClient.js";

const app = express();
const server = createServer(app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(middleware);
app.use(userContextMiddleware); // inject user info if needed

setupSwagger(app);

//app.use("/api/bookings", requireInternal);

// Database connection
const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log("✅ Data Source has been initialized!");
  } catch (err) {
    console.error("❌ Error during Data Source initialization:", err);
    throw err;
  }
};
const initializeRedisLogging = () => {
  redisClient.on("connect", () => {
    console.log("✅ Redis connected");
  });

  redisClient.on("error", (err) => {
    console.error("❌ Redis error:", err);
  });
};

// Bootstrap function to initialize all connections
export const bootstrap = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    await initializeRedisLogging(); 
    await initRabbit();
    // Start your unified event consumer
    const bookingService = createBookingService();
    await startUnifiedEventConsumer(bookingService);
    console.log("✅ UnifiedEventConsumer started");
           
    console.log("🚀 All services initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  }
};

// Routes
app.use("/api/bookings/stats", BookingStatsController);
app.use("/api/bookings/bookings", BookingController);

// Error handler

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    // Close Redis connection
    
    
    // Close database connection
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
      console.log('🔌 Database connection closed');
    }
    // Note: Add RabbitMQ connection close if you add a close() method to ShowtimeProducer
    
    process.exit(0);
  });
});
export { server };
export default app;
