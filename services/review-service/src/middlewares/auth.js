// src/middlewares/auth.js

// Tương đương UserContext + AuthChecker bên Java

function getUserContext(req) {
  const userId = req.header("X-User-Id") || null;
  const role = req.header("X-User-Role") || null;
  const authenticatedHeader = req.header("X-Authenticated");

  // Nếu gateway set X-Authenticated thì dùng luôn,
  // còn test bằng Postman, nếu không set thì coi như authenticated nếu có userId
  const authenticated =
    typeof authenticatedHeader === "string"
      ? authenticatedHeader.toLowerCase() === "true"
      : !!userId;

  return { userId, role, authenticated };
}

function requireAuthenticated(req, res, next) {
  const ctx = getUserContext(req);

  if (!ctx || !ctx.authenticated || !ctx.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  req.user = ctx; // giống UserContext.set(...)
  next();
}

function requireManagerOrAdmin(req, res, next) {
  const ctx = getUserContext(req);

  if (!ctx || !ctx.authenticated || !ctx.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const role = (ctx.role || "").toUpperCase();
  if (role !== "ADMIN" && role !== "MANAGER") {
    return res
      .status(403)
      .json({ message: "Manager or Admin access required" });
  }

  req.user = ctx;
  next();
}

function requireAdmin(req, res, next) {
  const ctx = getUserContext(req);

  if (!ctx || !ctx.authenticated || !ctx.userId) {
    return res.status(401).json({ message: "User not authenticated" });
  }

  const role = (ctx.role || "").toUpperCase();
  if (role !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }

  req.user = ctx;
  next();
}

// Helper giống getUserIdOrThrow (dùng trong controller nếu muốn)
function getUserIdOrThrow(req, res) {
  const ctx = getUserContext(req);
  if (!ctx || !ctx.userId || !ctx.authenticated) {
    // Trong Express thường dùng res.status thay vì throw exception
    res.status(401).json({ message: "User not authenticated" });
    return null;
  }
  return ctx.userId;
}

module.exports = {
  requireAuthenticated,
  requireManagerOrAdmin,
  requireAdmin,
  getUserIdOrThrow,
};
