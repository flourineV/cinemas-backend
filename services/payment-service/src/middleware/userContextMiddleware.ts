import type { RequestWithUserContext } from '../types/userContext.js';
import type { Response, NextFunction } from 'express';

export function userContextMiddleware(req: RequestWithUserContext, _res: Response, next: NextFunction) {
  req.userContext = {
    userId: req.headers['x-user-id'] as string,
    role: req.headers['x-user-role'] as string,
    authenticated: req.headers['x-authenticated'] === 'true',
  };
  next();
}