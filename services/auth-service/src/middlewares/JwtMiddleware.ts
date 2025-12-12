import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export function JwtMiddleware(secret: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ message: "Missing Authorization header" });
    }

    const token = authHeader.split(" ")[1];
    try {
      const claims = jwt.verify(token, secret) as any;
      (req as any).userContext = {
        userId: claims.sub,
        role: claims.role,
      };
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
  };
}
