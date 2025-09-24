import express from "express";
import { AppDataSource } from "./config/database";
//import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middlewares/errorHandler";

const app = express();

// Initialize database connection
AppDataSource.initialize()
  .then(() => {
    console.log("✅ Database connected successfully");
  })
  .catch((error) => {
    console.error("❌ Error connecting to database. Details:", {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
    process.exit(1);
  });

// Health check route
app.get('/', (req, res) => {
  res.json({ 
    status: 'OK',
    service: 'Auth Service',
    timestamp: new Date().toISOString()
  });
});

app.use(express.json());
//app.use("/auth", authRoutes);
app.use(errorHandler);

export default app;
