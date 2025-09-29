import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config/index.js";
function extractUser(payload: any) {
  const sub = payload?.sub ?? payload?.id ?? payload?.userId;
  const role = payload?.role ?? "USER";
  if (!sub) return undefined;
  return { sub: String(sub), role };
}

export function jwtOptional(req: Request, _res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return next();
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    const u = extractUser(payload);
    if (u) req.user = u;
  } catch {
    /* ignore */
  }
  next();
}

export function jwtRequired(req: Request, res: Response, next: NextFunction) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token)
    return res
      .status(401)
      .json({ error: { code: "UNAUTHORIZED", message: "Missing token" } });
  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    const u = extractUser(payload);
    if (!u)
      return res.status(403).json({
        error: { code: "FORBIDDEN", message: "Invalid token payload" },
      });
    req.user = u;
    next();
  } catch {
    return res
      .status(403)
      .json({ error: { code: "FORBIDDEN", message: "Invalid token" } });
  }
}
