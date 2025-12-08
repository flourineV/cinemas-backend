import { Request, Response, NextFunction } from "express";
import { ErrorResponse } from "../types";

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  console.error("[ERROR]", err);

  const errorResponse: ErrorResponse = {
    status: err.status || err.statusCode || 500,
    message: err.message || "Internal Server Error",
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  res.status(errorResponse.status).json(errorResponse);
};

export const notFoundHandler = (req: Request, res: Response) => {
  const errorResponse: ErrorResponse = {
    status: 404,
    message: `Route ${req.method} ${req.path} not found`,
    timestamp: new Date().toISOString(),
    path: req.path,
  };

  res.status(404).json(errorResponse);
};
