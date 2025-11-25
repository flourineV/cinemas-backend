// src/utils/logger.js

function info(message, meta = {}) {
  if (meta && Object.keys(meta).length > 0) {
    console.log("[INFO]", message, meta);
  } else {
    console.log("[INFO]", message);
  }
}

function error(message, meta = {}) {
  if (meta && Object.keys(meta).length > 0) {
    console.error("[ERROR]", message, meta);
  } else {
    console.error("[ERROR]", message);
  }
}

function warn(message, meta = {}) {
  if (meta && Object.keys(meta).length > 0) {
    console.warn("[WARN]", message, meta);
  } else {
    console.warn("[WARN]", message);
  }
}

function debug(message, meta = {}) {
  if (process.env.NODE_ENV !== "production") {
    if (meta && Object.keys(meta).length > 0) {
      console.debug("[DEBUG]", message, meta);
    } else {
      console.debug("[DEBUG]", message);
    }
  }
}

// Export theo cả 2 kiểu:
// 1) logger.info(...)  logger.error(...)
// 2) logInfo(...)      logError(...)
module.exports = {
  info,
  error,
  warn,
  debug,
  logInfo: info,
  logError: error,
};
