import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/Database";
import authRoutes from "./routes/AuthRoutes";
import userRoutes from "./routes/UserRoutes";
import statsRoutes from "./routes/StatsRoutes";
import passwordResetRoutes from "./routes/PasswordResetRoutes";
import refreshTokenRoutes from "./routes/RefreshTokenRoutes";
import { errorHandler } from "./middlewares/errorHandler";
import { JwtMiddleware } from "./middlewares/JwtMiddleware";
// import { serviceErrorHandler } from "./middlewares/serviceErrorHandler";
import cookieParser from "cookie-parser";
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((error) => {
    console.error("❌ Error connecting to database. Details:", {
      message: error.message,
      code: error.code,
      stack: error.stack,
    });
    process.exit(1);
  });

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "Auth Service",
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use("/api/auth", authRoutes);

// Protected routes
app.use(JwtMiddleware(process.env.APP_JWT_SECRET!));
app.use("/api/users", userRoutes);
app.use("/api/stats", statsRoutes);
app.use("/api/password-reset", passwordResetRoutes);
app.use("/api/refresh-token", refreshTokenRoutes);

// Error handling middleware
//app.use(serviceErrorHandler);
app.use(errorHandler);

export default app;
