import { Request, Response, NextFunction } from "express";
import morgan from "morgan";

morgan.token("user-id", (req: Request) => {
  return (req as any).user?.userId || "anonymous";
});

morgan.token("user-role", (req: Request) => {
  return (req as any).user?.role || "none";
});

// Custom format
const morganFormat =
  ":method :url :status :response-time ms - :res[content-length] | User: :user-id (:user-role)";

export const loggerMiddleware = morgan(morganFormat, {
  skip: (req: Request) => {
    // Skip logging for health checks
    return req.url === "/health" || req.url === "/api/health";
  },
});

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(
      `[${new Date().toISOString()}] ${req.method} ${req.path} - ${
        res.statusCode
      } (${duration}ms)`
    );
  });

  next();
};
