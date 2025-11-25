const { internalAuthSecret } = require("../config");

/**
 * Check header nội bộ, tương đương InternalAuthChecker.requireInternal(...)
 * Header dùng: X-Internal-Key
 */
function requireInternal(req, res, next) {
  const headerKey = req.header("X-Internal-Key");

  if (!headerKey || headerKey !== internalAuthSecret) {
    return res.status(403).json({ message: "Invalid internal service key" });
  }

  next();
}

module.exports = { requireInternal };
