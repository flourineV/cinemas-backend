import app from "./app";
import mongoose from "mongoose";

const PORT = process.env.PORT || 4000;

mongoose.connect(process.env.MONGO_URI!)
  .then(() => {
    console.log("✅ DB connected");
    app.listen(PORT, () => console.log(`🚀 Auth-service running on http://localhost:${PORT}`));
  })
  .catch(err => console.error("❌ DB connection error:", err));
