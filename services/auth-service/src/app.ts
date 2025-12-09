import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
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

//Middleware
app.use(cors());
app.use(express.json());
app.use(cookieParser());

//Database connection
AppDataSource.initialize()
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((error) => {
    console.error("Error connecting to database. Details:", {
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

// Routes and check route
app.use("/api/auth", authRoutes);
app.use(
  "/api/auth/users",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  userRoutes
);
app.use(
  "/api/auth/stats",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  statsRoutes
);
app.use("/api/auth/refreshtoken", refreshTokenRoutes);
app.use("/api/auth", passwordResetRoutes);

// Error handling middleware
//app.use(serviceErrorHandler);
app.use(errorHandler);

export default app;
