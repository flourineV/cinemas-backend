import type { Request, Response, NextFunction } from "express";
import { logger } from "./logging.js";

export function notFound(_req: Request, res: Response) {
  res
    .status(404)
    .json({ error: { code: "NOT_FOUND", message: "Route not found" } });
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || 500;
  const payload = {
    error: {
      code: err.code || "INTERNAL_ERROR",
      message: err.message || "Internal server error",
      req_id: req.reqId,
    },
  };
  logger.error({ ...payload, stack: err.stack });
  res.status(status).json(payload);
}
