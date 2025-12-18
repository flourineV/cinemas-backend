import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/database";
import refundVoucherRoute from "./routes/refundVoucherRoutes";
import usedPromotionRoute from "./routes/usedPromotionRoutes";
import promotionRoute from "./routes/promotionRoutes";
import { errorHandler } from "./middlewares/errorHandle";
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
    service: "Pricing Service",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());

// Routes
// refund voucher
app.use("/api/promotions/refund-vouchers", refundVoucherRoute);
// usage
app.use("/api/promotions/usage", usedPromotionRoute);
// promotions
app.use(
  "/api/promotions",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  promotionRoute
);
// Error handling middleware
// app.use(serviceErrorHandler);
app.use(errorHandler);

export default app;
