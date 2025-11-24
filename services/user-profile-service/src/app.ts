import express from "express";
import cors from "cors";
import { AppDataSource } from "./config/Database";
import { errorHandler } from "./middlewares/errorHandler";
//import userProfileRoutes from "./routes/user_profile.route";
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
    process.exit(1);  });

// Health check route
app.get("/", (req, res) => {
  res.json({
    status: "OK",
    service: "User Profile Service",
    timestamp: new Date().toISOString(),
  });
});

app.use(express.json());

// // Routes
// app.use("/api/user-profiles", userProfileRoutes);

// // Error handling middleware
// //app.use(serviceErrorHandler);
// app.use(errorHandler);

export default app;
