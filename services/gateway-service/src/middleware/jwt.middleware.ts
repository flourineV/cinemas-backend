import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { JwtUtil } from "../utils/jwt.util";
import { PathMatcher } from "../utils/path-matcher.util";

export const createJwtMiddleware = (excludePaths?: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path;

    // Check if path is excluded
    if (PathMatcher.isExcluded(path, excludePaths)) {
      console.log(`[JWT] Path ${path} is excluded, skipping auth`);
      return next();
    }

    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.warn(`[JWT] Missing or invalid Authorization header for ${path}`);
      return res.status(401).json({
        status: 401,
        message: "Missing or invalid Authorization header",
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }

    try {
      const token = authHeader.substring(7);

      // Validate token
      if (!JwtUtil.validateToken(token)) {
        console.warn(`[JWT] Invalid token for ${path}`);
        return res.status(401).json({
          status: 401,
          message: "Invalid JWT token",
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }

      // Extract user info
      const userId = JwtUtil.getUserIdFromToken(token);
      const role = JwtUtil.getRoleFromToken(token);

      if (!userId) {
        return res.status(401).json({
          status: 401,
          message: "Invalid token payload",
          timestamp: new Date().toISOString(),
          path: req.path,
        });
      }

      // Attach user info to request
      (req as AuthenticatedRequest).user = {
        userId,
        role: role || "USER",
      };

      // Add headers for downstream services
      req.headers["x-user-id"] = userId;
      req.headers["x-user-role"] = role || "";
      req.headers["x-authenticated"] = "true";

      next();
    } catch (error) {
      console.error("[JWT] Error processing token:", error);
      return res.status(401).json({
        status: 401,
        message: "Error verifying JWT",
        timestamp: new Date().toISOString(),
        path: req.path,
      });
    }
  };
};
