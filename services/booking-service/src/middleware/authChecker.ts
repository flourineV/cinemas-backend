import type { UserContext } from '../types/userContext.js';
import type { RequestWithUserContext } from '../types/userContext.js';
import type { Response, NextFunction } from 'express';
export function requireAdmin(ctx?: UserContext) {
  if (!ctx || ctx.role?.toUpperCase() !== 'ADMIN') {
    throw new Error('Admin access required');
  }
}

export function requireManagerOrAdmin(req: RequestWithUserContext, res: Response, next: NextFunction) {
  if (!req.userContext || !['ADMIN', 'MANAGER'].includes(req.userContext.role?.toUpperCase() || '')) {
    throw new Error('Manager or Admin access required');
  }
}

export function requireAuthenticated(req: RequestWithUserContext, res: Response, next: NextFunction) {
  if (!req.userContext || !req.userContext.authenticated) {
    return res.status(401).json({ message: 'User not authenticated' });
  }
  next();
}

export function getUserIdOrThrow(ctx?: UserContext): string {
  if (!ctx || !ctx.userId) {
    throw new Error('User not authenticated');
  }
  return ctx.userId;
}

export function isManager(ctx?: UserContext) {
  return ctx?.role?.toUpperCase() === 'MANAGER';
}

export function isAdmin(ctx?: UserContext) {
  return ctx?.role?.toUpperCase() === 'ADMIN';
}