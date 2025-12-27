import { requireAuthenticated } from '../middleware/authChecker.js';
import type { RequestWithUserContext } from 'types/userContext.js';
import type { Request, Response, NextFunction } from 'express';

const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;

export async function requireInternalOrAuth(
    req: RequestWithUserContext,
    res: Response,
    next: NextFunction
) {
    const internalKey = req.header('x-internal-secret');

    if (internalKey === INTERNAL_SECRET_KEY) {
        // Internal request allowed
        return next();
    }

    // Otherwise require authenticated user
    if (!req.userContext) {
        return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    try {
        // Validate user context
        await requireAuthenticated(req.userContext);
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Unauthorized: Invalid user' });
    }
}