import "dotenv/config"
import { bootstrap, server } from "./app.js";

const PORT = process.env.PORT || 3000;

// Initialize all services then start server
bootstrap()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server is running on port ${PORT}`);
      console.log(`📚 Swagger docs available at http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  });