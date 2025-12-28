import express from "express";
import { AppDataSource } from "./config/database";
import { errorHandler } from "./middlewares/errorHandler";
import userProfileRoute from "./routes/UserProfileRoute";
import userStatsRoute from "./routes/UserStatsRoute";
import managerProfileRoute from "./routes/ManagerProfileRoute";
import userRankRoute from "./routes/UserRankRoute";
import userFavorriteMovieRoute from "./routes/UserFavoriteMovieRoute";
import loyalHistoryRoute from "./routes/LoyaltyHistoryRoute";
import { JwtMiddleware } from "./middlewares/JwtMiddleware";

const app = express();

//Middleware
app.use(express.json());

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
    service: "User Profile Service",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());

// Routes
app.use(
  "/api/profiles/profiles",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  userProfileRoute
);
app.use(
  "/api/profiles/loyalty-history",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  loyalHistoryRoute
);
app.use(
  "/api/profiles/stats",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  userStatsRoute
);
app.use(
  "/api/profiles/manager",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  managerProfileRoute
);
app.use(
  "/api/profiles/ranks",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  userRankRoute
);
app.use(
  "/api/profiles/favorites",
  JwtMiddleware(process.env.APP_JWT_SECRET!),
  userFavorriteMovieRoute
);

// Error handling middleware
app.use(errorHandler);

export default app;
