// src/utils/logger.js

function logInfo(message, meta = {}) {
  if (Object.keys(meta).length > 0) {
    console.log("[INFO]", message, meta);
  } else {
    console.log("[INFO]", message);
  }
}

function logError(message, meta = {}) {
  if (Object.keys(meta).length > 0) {
    console.error("[ERROR]", message, meta);
  } else {
    console.error("[ERROR]", message);
  }
}

module.exports = { logInfo, logError };
