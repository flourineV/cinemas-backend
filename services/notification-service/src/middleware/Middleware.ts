import type { Request, Response, NextFunction } from "express";
import { UserContext } from "./UserContext.js";
import type { IUserContext } from "./UserContext.js";

export function Middleware(req: Request, res: Response, next: NextFunction): void {
  const userId = req.header("X-User-Id") || undefined;
  const role = req.header("X-User-Role") || undefined;
  const authenticatedHeader = req.header("X-Authenticated") || "false";

  const authenticated = authenticatedHeader.toLowerCase() === "true";
    const context: IUserContext = {
        authenticated,
        ...(userId ? { userId } : {}),
        ...(role ? { role } : {}),
    };
  UserContext.set(context);

  console.log(
    `[NotificationService] Request from user=${userId}, role=${role}, authenticated=${authenticated}`
  );

  // Clear context after response is finished
  res.on("finish", () => {
    UserContext.clear();
  });

  next();
}
