import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import authRoutes from "./routes/auth.route";
import { errorHandler } from "./middlewares/errorHandler";
import { serviceErrorHandler } from "./middlewares/serviceErrorHandler";
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

app.use(express.json());

// Routes
app.use("/api/auth", authRoutes);

// Error handling middleware
app.use(serviceErrorHandler);
app.use(errorHandler);

export default app;
