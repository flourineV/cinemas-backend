// helper: lấy ctx từ req
function getContext(req) {
  return req.userContext || null;
}

function requireAdmin(req, res, next) {
  const ctx = getContext(req);
  if (!ctx || !ctx.role || ctx.role.toUpperCase() !== "ADMIN") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function requireManagerOrAdmin(req, res, next) {
  const ctx = getContext(req);
  const role = ctx?.role?.toUpperCase() || "";

  if (role !== "ADMIN" && role !== "MANAGER") {
    return res
      .status(403)
      .json({ message: "Manager or Admin access required" });
  }
  next();
}

function requireAuthenticated(req, res, next) {
  const ctx = getContext(req);
  if (!ctx || !ctx.authenticated) {
    return res.status(401).json({ message: "User not authenticated" });
  }
  next();
}

// Giống getUserIdOrThrow trong Java (dùng trong controller/service nếu cần)
function getUserIdOrThrow(req) {
  const ctx = getContext(req);
  if (!ctx || !ctx.userId) {
    const err = new Error("User not authenticated");
    err.status = 401;
    throw err;
  }
  return ctx.userId;
}

module.exports = {
  requireAdmin,
  requireManagerOrAdmin,
  requireAuthenticated,
  getUserIdOrThrow,
};
