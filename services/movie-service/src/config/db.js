const mongoose = require("mongoose");
const { mongoUri } = require("./index");
const { logInfo, logError } = require("../utils/logger");

async function connectMongo() {
  try {
    await mongoose.connect(mongoUri);

    const safeUri = String(mongoUri || "").replace(
      /\/\/([^:]+):([^@]+)@/,
      "//$1:***@"
    );

    logInfo("Connected to MongoDB", { mongoUri: safeUri });
  } catch (err) {
    logError("Failed to connect MongoDB", { error: err.message });
    process.exit(1);
  }
}

module.exports = { connectMongo };
