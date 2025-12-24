import type { Request, Response, NextFunction } from "express";

export function middleware(req: Request, res: Response, next: NextFunction) {
  // Read custom headers
  const userId = req.header("x-user-id");
  const role = req.header("x-user-role");
  const authenticated = req.header("x-authenticated");

  console.log(
    `[ShowtimeService] Request from user=${userId}, role=${role}, authenticated=${authenticated}, path=${req.path}`
  );

  // Continue to next middleware/route
  next();
}
