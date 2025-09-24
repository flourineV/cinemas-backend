import { Request, Response, NextFunction } from "express";
import passport from "passport";
import { JwtUser } from "../config/refresh";

// Extend Express Request type to include user property
declare global {
  namespace Express {
    interface User extends JwtUser {}
    interface Request {
      user?: User;
    }
  }
}

// Middleware to protect route /me
export const JwtAuthGuard = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authenticate = passport.authenticate(
    "jwt",
    { session: false },
    (err: any, user: JwtUser | false, info: any): void => {
      if (err || !user) {
        res.status(401).json({
          message: "Unauthorized",
          error: "Please log in to access",
        });
        return;
      }
      req.user = user;
      next();
    }
  );

  authenticate(req, res, next);
};

// Role Guard
export const RoleGuard = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as JwtUser;
    if (!user) {
      return res.status(401).json({
        message: "Unauthorized access",
        error: "User not authenticated",
      });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: "Forbidden",
        error: "User does not have the required role",
      });
    }

    next();
  };
};
