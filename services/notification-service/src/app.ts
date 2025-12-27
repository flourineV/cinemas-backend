import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import bodyParser from "body-parser";
import { AppDataSource } from "./data-source.js";
import ContactController from "./controllers/ContactController.js";
import NotificationController from "./controllers/NotificationController.js";
import { Middleware } from "./middleware/Middleware.js";
import { setupSwagger } from "./config/swagger.js"; 

const app = express();

// Middleware
app.use(cors());
app.use(helmet());
app.use(morgan("dev"));
app.use(compression());
app.use(express.json());

setupSwagger(app);

app.use(Middleware);

// Database connection
AppDataSource.initialize()
  .then(() => {
    console.log("📦 Data Source has been initialized!");
  })
  .catch((err) => {
    console.error("❌ Error during Data Source initialization:", err);
  });

// Controllers
app.use("/api/notifications/contact", ContactController);
app.use("/api/notifications/notifications", NotificationController);

export default app;
