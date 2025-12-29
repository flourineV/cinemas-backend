import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { createClient } from "redis";
import { AppDataSource } from "./data-source.js";
import { createServer } from "http";
//import { requireInternal } from "./middleware/internalAuthChecker.js";
import { middleware } from "./middleware/middleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {userContextMiddleware} from "./middleware/userContext.js";

// Controllers
import ShowtimeController from "./controllers/ShowtimeController.js";
import ShowtimeSeatController from "./controllers/ShowtimeSeatController.js";
import TheaterController from "./controllers/TheaterController.js";
import RoomController from "./controllers/RoomController.js";
import ProvinceController from "./controllers/ProvinceController.js";
import ShowtimeStatusController from "./controllers/ShowtimeStatusController.js";
import ShowtimeStatsController from "./controllers/ShowtimeStatsController.js";
import SupabaseController from "./controllers/SupabaseController.js";
import SeatLockController  from "./controllers/SeatLockController.js";
import SeatController from "./controllers/SeatController.js";

// Import shared instances
import { server, redisClient, showtimeProducer, connectRedis } from "./shared/instances.js";

import { setupSwagger } from "./config/swagger.js";

const app = express();
server.on('request', app);

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(middleware);
app.use(userContextMiddleware); // inject user info if needed

setupSwagger(app);

//app.use("/api/showtimes", requireInternal);

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

// Bootstrap function to initialize all connections
export const bootstrap = async () => {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Initialize Redis
    await connectRedis();
           
    console.log("🚀 All services initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  }
};

// Routes
app.use("/api/showtimes/showtimes", ShowtimeController);
app.use("/api/showtimes/seats", SeatController);
app.use("/api/showtimes/seat-lock", SeatLockController);
app.use("/api/showtimes/showtimeseats", ShowtimeSeatController);
app.use("/api/showtimes/theaters", TheaterController);
app.use("/api/showtimes/rooms", RoomController);
app.use("/api/showtimes/provinces", ProvinceController);
app.use("/api/showtimes/status", ShowtimeStatusController);
app.use("/api/showtimes/stats", ShowtimeStatsController);
app.use("/api/showtimes/supabase", SupabaseController);

// Error handler
app.use(errorHandler);
// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('⚠️ SIGTERM signal received: closing HTTP server');
  server.close(async () => {
    console.log('🔌 HTTP server closed');
    
    // Close Redis connection
    if (redisClient.isOpen) {
      await redisClient.quit();
      console.log('🔌 Redis connection closed');
    }
    
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
