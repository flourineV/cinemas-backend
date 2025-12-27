import "dotenv/config";
import app from "./app.js";
import { createServer } from "http";
import { NotificationConsumer } from "./consumer/NotificationConsumer.js";
import { NotificationService } from "./services/NotificationService.js";
import { AppDataSource } from "./data-source.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 8089;

const server = createServer(app);

server.listen(PORT, async () => {
  console.log(`[Server] 🚀 Running on http://localhost:${PORT}`);
  console.log(`Swagger docs available at http://localhost:${PORT}/api-docs`);
  try {
    const notificationService = new NotificationService(AppDataSource);
    const consumer = new NotificationConsumer(notificationService);
    await consumer.init();
    console.log("[Server] ✅ NotificationConsumer initialized");
    
  } catch (err) {
    console.error("[Server] ❌ Failed to init NotificationConsumer:", err);
  }
});
