import { Request } from "express";

export class AuthChecker {
  // bắt buộc quyền ADMIN
  static requireAdmin(req: Request) {
    const ctx = (req as any).userContext;
    if (!ctx || ctx.role?.toUpperCase() !== "ADMIN") {
      const err: any = new Error("Admin access required");
      err.status = 403;
      throw err;
    }
  }

  // bắt buộc quyền ADMIN or MANAGER
  static requireManagerOrAdmin(req: Request) {
    const ctx = (req as any).userContext;
    if (
      !ctx ||
      (ctx.role?.toUpperCase() !== "ADMIN" &&
        ctx.role?.toUpperCase() !== "MANAGER")
    ) {
      const err: any = new Error("Manager or Admin access required");
      err.status = 403;
      throw err;
    }
  }

  // bắt buộc đăng nhập
  static requireAuthenticated(req: Request) {
    const ctx = (req as any).userContext;
    if (!ctx) {
      const err: any = new Error("User not authenticated");
      err.status = 401;
      throw err;
    }
  }

  // lấy userid bắt buộc đăng nhập
  static getUserIdOrThrow(req: Request): string {
    const ctx = (req as any).userContext;
    if (!ctx || !ctx.userId) {
      const err: any = new Error("User not authenticated");
      err.status = 401;
      throw err;
    }
    return ctx.userId;
  }
}

