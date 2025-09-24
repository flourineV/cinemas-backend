import rateLimit from "express-rate-limit";

export const createRateLimiter = (windowMs = 60_000, max = 600) =>
  rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: { code: "RATE_LIMITED", message: "Too many requests" } },
  });
