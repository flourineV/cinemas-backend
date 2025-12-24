import { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[Error] ${err.message}`);
  console.error(err.stack);

  const statusCode = err.status || 500;
  const errorType = err.type || "InternalError";

  res.status(statusCode).json({
    success: false,
    error: {
      type: errorType,
      message: err.message || "Internal Server Error",
    },
  });
}
