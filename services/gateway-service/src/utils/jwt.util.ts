import jwt from "jsonwebtoken";
import { JwtPayload } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export class JwtUtil {
  static validateToken(token: string): boolean {
    try {
      jwt.verify(token, JWT_SECRET);
      return true;
    } catch (error) {
      console.error("JWT validation error:", error);
      return false;
    }
  }

  static getUserIdFromToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded.sub;
    } catch (error) {
      console.error("Error extracting userId from token:", error);
      return null;
    }
  }

  static getRoleFromToken(token: string): string | null {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      return decoded.role;
    } catch (error) {
      console.error("Error extracting role from token:", error);
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
      if (!decoded.exp) return false;
      return Date.now() >= decoded.exp * 1000;
    } catch (error) {
      return true;
    }
  }

  static decodeToken(token: string): JwtPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as JwtPayload;
    } catch (error) {
      return null;
    }
  }
}
