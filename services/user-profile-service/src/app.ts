import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/Database";
import { errorHandler } from "./middlewares/errorHandler";
import userProfileRoute from "./routes/UserProfileRoute";
import userStatsRoute from "./routes/UserStatsRoute";
import managerProfileRoute from "./routes/ManagerProfileRoute";
import staffProfileRoute from "./routes/StaffProfileRoute";
import userRankRoute from "./routes/UserRankRoute";
import userFavorriteMovieRoute from "./routes/UserFavoriteMovieRoute";

const app = express();

//Middleware
app.use(cors());
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
app.use("/api/profiles/profiles", userProfileRoute);
app.use("/api/profiles/stats", userStatsRoute);
app.use("/api/profiles/manager", managerProfileRoute);
app.use("/api/profiles/staff", staffProfileRoute);
app.use("/api/profiles/ranks", userRankRoute);
app.use("/api/profiles/favorites", userFavorriteMovieRoute);

// Error handling middleware
app.use(errorHandler);

export default app;
