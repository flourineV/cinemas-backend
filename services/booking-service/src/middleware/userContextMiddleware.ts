import type { RequestWithUserContext } from '../types/userContext.js';
import type { Response, NextFunction } from 'express';

export function userContextMiddleware(req: RequestWithUserContext, _res: Response, next: NextFunction) {
  // Inject userId directly here (dev/testing)
  const userIdFromHeader = req.header('x-user-id');
  const roleFromHeader = req.header('x-user-role');

  req.userContext = {
    userId: userIdFromHeader ?? '6c315ff4-a750-429a-926a-290c1e1285dd', // default dev ID
    role: roleFromHeader ?? 'USER',             // default dev role
    authenticated: true,                        // always true for dev
  };
  next();
}