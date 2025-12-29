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
import PaymentStatsController from "./controllers/PaymentStatsController.js";
import PaymentController from "./controllers/PaymentController.js";

// Import shared instances
import {paymentProducer, userProfileClient} from "./shared/instances.js";
import {setupSwagger} from "./config/swagger.js";
import { connectRabbitMQ } from "./config/rabbitConfig.js";
import { PaymentConsumer } from "./consumer/PaymentConsumer.js";
import { PaymentService } from "./services/PaymentService.js";
import { createHmac } from "crypto";

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

// Swagger UI
setupSwagger(app);

//app.use("/api/payments", requireInternal);

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

    await connectRabbitMQ(process.env.RABBITMQ_URL!);
  
    
    const paymentService = new PaymentService(
      AppDataSource,
      paymentProducer,
      userProfileClient
    );
     // Init consumer
    const paymentConsumer = new PaymentConsumer(paymentService);
    await paymentConsumer.startConsuming();
    // testing
        const dataStr = JSON.stringify({
          app_trans_id: "251229_34f9b7bd",
          amount: 100000
        });
        const mac = createHmac('sha256', process.env.ZALOPAY_KEY1!).update(dataStr).digest('hex');
        console.log('Test MAC:', mac);
    console.log("🚀 All services initialized successfully!");
  } catch (error) {
    console.error("❌ Failed to initialize services:", error);
    process.exit(1);
  }
};

// Routes
app.use("/api/payments/stats", PaymentStatsController);
app.use("/api/payments/payments", PaymentController);

// WebSocket handler (if using socket.io or ws)
//SeatLockWebSocketHandler(app, redisClient);

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