import morgan from "morgan";
import winston from "winston";
import type { Request, Response } from "express";

export const logger = winston.createLogger({
  level: "info",
  transports: [
    new winston.transports.Console({ format: winston.format.json() }),
  ],
});

export const httpLogger = morgan((tokens, req: Request, res: Response) => {
  const line = {
    method: tokens.method(req, res),
    url: tokens.url(req, res),
    status: Number(tokens.status(req, res)),
    length: tokens.res(req, res, "content-length"),
    response_time_ms: Number(tokens["response-time"](req, res)),
    req_id: (req as any).reqId,
    user: (req as any).user?.sub, // ép kiểu để morgan không “kén chọn”
  };
  logger.info(line);
  return undefined; // morgan cho phép trả undefined để tự log qua winston
});
