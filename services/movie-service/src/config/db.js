const mongoose = require("mongoose");
const { mongoUri } = require("./index");
const { logInfo, logError } = require("../utils/logger");

async function connectMongo() {
  try {
    await mongoose.connect(mongoUri);
    logInfo("Connected to MongoDB", { mongoUri });
  } catch (err) {
    logError("Failed to connect MongoDB", { error: err.message });
    process.exit(1);
  }
}

module.exports = { connectMongo };
