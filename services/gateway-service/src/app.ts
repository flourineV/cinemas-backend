import express, { Application } from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";
import { corsOptions } from "./config/cors.config";
import { gatewayConfig } from "./config/gateway.config";
import { createProxyRouter } from "./proxy/proxy.handler";
import { loggerMiddleware } from "./middleware/logger.middleware";
import { errorHandler, notFoundHandler } from "./middleware/error.middleware";
import searchRouter from "./controllers/search.controller";
// Load environment variables
dotenv.config();

const app: Application = express();
const PORT = process.env.PORT || 8099;

// Security middleware
app.use(helmet());
app.use(cors(corsOptions));
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Logging
app.use(loggerMiddleware);

// Setup proxy routes
console.log("[GATEWAY] Setting up routes...");
gatewayConfig.routes.forEach((route) => {
  console.log(
    `[GATEWAY] Registering route: ${route.id} - ${route.path} -> ${route.target}`
  );
  const proxyRouter = createProxyRouter(route);
  app.use(route.path, proxyRouter);
});

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check
app.get("/health", (_req, res) => {
  res.json({
    status: "UP",
    timestamp: new Date().toISOString(),
    service: "gateway-service",
  });
});

// API info
app.get("/", (_req, res) => {
  res.json({
    name: "CineHub API Gateway",
    version: "1.0.0",
    routes: gatewayConfig.routes.map((r) => ({
      id: r.id,
      path: r.path,
      target: r.target,
      requireAuth: r.requireAuth,
    })),
  });
});
// route search aggregator: /api/search
app.use("/api/search", searchRouter);
// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log("=".repeat(60));
  console.log(`🚀 CineHub API Gateway started`);
  console.log(`📍 Server running on port ${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔒 JWT Secret configured: ${!!process.env.JWT_SECRET}`);
  console.log(`📦 Routes configured: ${gatewayConfig.routes.length}`);
  console.log("=".repeat(60));
  gatewayConfig.routes.forEach((route) => {
    console.log(
      `   ➜ ${route.id.padEnd(25)} ${route.path.padEnd(20)} → ${route.target}`
    );
  });
  console.log("=".repeat(60));
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM signal received: closing HTTP server");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT signal received: closing HTTP server");
  process.exit(0);
});

export default app;
