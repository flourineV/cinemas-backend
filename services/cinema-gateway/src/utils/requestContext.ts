import { randomUUID } from "crypto";
import type { Request, Response, NextFunction } from "express";

export function attachRequestId(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  req.reqId = randomUUID();
  next();
}
