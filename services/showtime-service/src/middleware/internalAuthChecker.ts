const INTERNAL_SECRET_KEY = process.env.INTERNAL_SECRET_KEY;

export function requireInternal(headerKey?: string) {
  if (!headerKey || headerKey !== INTERNAL_SECRET_KEY) {
    throw new Error('Invalid internal service key');
  }
}