import type { UserContext } from '../types/userContext.js';

export function requireAdmin(ctx?: UserContext) {
  if (!ctx || ctx.role?.toUpperCase() !== 'ADMIN') {
    throw new Error('Admin access required');
  }
}

export function requireManagerOrAdmin(ctx?: UserContext) {
  if (!ctx || !['ADMIN', 'MANAGER'].includes(ctx.role?.toUpperCase() || '')) {
    throw new Error('Manager or Admin access required');
  }
}

export function requireAuthenticated(ctx?: UserContext) {
  if (!ctx || !ctx.authenticated) {
    throw new Error('User not authenticated');
  }
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
