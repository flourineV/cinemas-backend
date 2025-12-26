const { internalAuthSecret } = require("../config");

/**
 * Java: @RequestHeader("X-Internal-Secret")
 */
function requireInternal(req, res, next) {
  const secret = req.header("X-Internal-Secret");

  if (!secret || secret !== internalAuthSecret) {
    return res.status(403).json({ message: "Invalid internal secret" });
  }

  next();
}

module.exports = { requireInternal };
