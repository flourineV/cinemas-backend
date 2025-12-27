import type { Request, Response, NextFunction } from 'express';
import type { RequestWithUserContext } from '../types/userContext.js';

const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;

export function requireInternalOrManager(req: RequestWithUserContext, res: Response, next: NextFunction) {
  const internalKey = req.header('x-internal-key');

  // Case 1: internal service call
  if (internalKey && internalKey === INTERNAL_SECRET_KEY) {
    return next();
  }

  // Case 2: manager/admin role
  if (req.userContext && req.userContext.role && ['manager', 'admin'].includes(req.userContext.role)) {
    return next();
  }

  // Otherwise forbidden
  return res.status(403).json({ error: 'Forbidden: Must be internal service or manager/admin' });
}
