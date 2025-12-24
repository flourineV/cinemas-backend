import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import { createClient } from "redis";
import { AppDataSource } from "./data-source.js";
import { requireInternal } from "./middleware/internalAuthChecker.js";
import { middleware } from "./middleware/middleware.js";
import { errorHandler } from "./middleware/errorHandler.js";
import {userContextMiddleware} from "./middleware/userContext.js";
import { SeatLockWebSocketHandler } from "./websocket/SeatLockWebSocketHandler.js";

// Controllers
import ShowtimeController from "./controllers/ShowtimeController.js";
import ShowtimeSeatController from "./controllers/ShowtimeSeatController.js";
import TheaterController from "./controllers/TheaterController.js";
import RoomController from "./controllers/RoomController.js";
import ProvinceController from "./controllers/ProvinceController.js";
import ShowtimeStatusController from "./controllers/ShowtimeStatusController.js";
import ShowtimeStatsController from "./controllers/ShowtimeStatsController.js";
import SupabaseController from "./controllers/SupabaseController.js";

import { setupSwagger } from "./config/swagger.js";

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());
app.use(middleware);
app.use(userContextMiddleware); // inject user info if needed

setupSwagger(app);

app.use("/api/showtimes", requireInternal);

// Redis setup
export const redisClient = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
redisClient.connect().catch(err => { console.error("❌ Redis connection failed:", err); });

// Database connection
AppDataSource.initialize()
  .then(() => {
    console.log("📦 Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("❌ Error during Data Source initialization:", err);
  });

// Routes
app.use("/api/showtimes/showtimes", ShowtimeController);
app.use("/api/showtimes/seats", ShowtimeSeatController);
app.use("/api/showtimes/theaters", TheaterController);
app.use("/api/showtimes/rooms", RoomController);
app.use("/api/showtimes/provinces", ProvinceController);
app.use("/api/showtimes/status", ShowtimeStatusController);
app.use("/api/showtimes/stats", ShowtimeStatsController);
app.use("/api/showtimes/supabase", SupabaseController);

// WebSocket handler (if using socket.io or ws)
//SeatLockWebSocketHandler(app, redisClient);

// Error handler
app.use(errorHandler);

export default app;
