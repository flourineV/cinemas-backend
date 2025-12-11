import jwt, { JwtPayload } from "jsonwebtoken";
import { v4 as uuid } from "uuid";
// cấu hình Jwt
export class JWT {
  private jwtSecret: string;
  private jwtExpirationMs: number;

  constructor() {
    this.jwtSecret = process.env.APP_JWT_SECRET || "defaultSecretKey";
    this.jwtExpirationMs = Number(process.env.APP_JWT_EXPIRATION_MS) || 3600000;
  }

  // tạo token
  generateAccessToken(userId: string, role: string): string {
    const payload = {
      role,
      type: "access",
    };

    return jwt.sign(payload, this.jwtSecret, {
      subject: userId,
      expiresIn: this.jwtExpirationMs / 1000,
      algorithm: "HS512",
    });
  }

  // tạo refresh token
  generateRefreshToken(): string {
    return uuid();
  }

  // lấy id user từ token
  getUserIdFromToken(token: string): string | null {
    try {
      const claims = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return claims.sub || null;
    } catch {
      return null;
    }
  }

  // lấy role từ token
  getRoleFromToken(token: string): string | null {
    try {
      const claims = jwt.verify(token, this.jwtSecret) as JwtPayload;
      return claims.role || null;
    } catch {
      return null;
    }
  }

  // lấy ngày hết hạn từ token
  getExpirationDateFromToken(token: string): Date | null {
    try {
      const claims = jwt.verify(token, this.jwtSecret) as JwtPayload;
      if (claims.exp) {
        return new Date(claims.exp * 1000);
      }
      return null;
    } catch {
      return null;
    }
  }

  // kiểm tra token còn hạn hay không
  isTokenExpired(token: string): boolean {
    const expiration = this.getExpirationDateFromToken(token);
    return expiration ? expiration.getTime() < Date.now() : true;
  }

  // check token hợp lệ
  validateToken(token: string): boolean {
    try {
      jwt.verify(token, this.jwtSecret);
      return true;
    } catch (err: any) {
      console.error("JWT validation error:", err.message);
      return false;
    }
  }
}
