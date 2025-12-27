import type { Request, Response, NextFunction } from 'express';

const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;

export function requireInternal(req: Request, res: Response, next: NextFunction) {
  console.log('🔐 requireInternal called');
  console.log('Secret from env:', INTERNAL_SECRET_KEY ? '✅ Set' : '❌ Not set');
  console.log('Header received:', req.header('x-internal-secret') ? '✅ Present' : '❌ Missing');
  const internalKey = req.header('x-internal-secret'); 
  
  if (!internalKey || internalKey !== INTERNAL_SECRET_KEY) {
    return res.status(403).json({ error: 'Forbidden: Invalid internal service key' });
  }
  
  next();
}