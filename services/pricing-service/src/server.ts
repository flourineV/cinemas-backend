import "reflect-metadata";
import "dotenv/config"; // Load environment variables first

import app from "./app";

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Pricing-service running on http://localhost:${PORT}`);
});
