export interface UserContext {
  userId?: string;
  role?: string;
  authenticated: boolean;
}

// Extend Express Request
import type { Request } from 'express';

export interface RequestWithUserContext extends Request {
  userContext?: UserContext;
}
