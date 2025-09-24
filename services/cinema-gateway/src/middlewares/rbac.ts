import type { Request, Response, NextFunction } from "express";

export function requireRole(...roles: Array<"USER" | "STAFF" | "ADMIN">) {
  return (req: Request, res: Response, next: NextFunction) => {
    const role = req.user?.role;
    if (!role)
      return res
        .status(401)
        .json({ error: { code: "UNAUTHORIZED", message: "No role" } });
    if (!roles.includes(role))
      return res
        .status(403)
        .json({ error: { code: "FORBIDDEN", message: "Insufficient role" } });
    next();
  };
}
