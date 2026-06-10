import type { VercelRequest, VercelResponse } from '@vercel/node';

export function methodNotAllowed(res: VercelResponse, allowed = 'POST') {
  res.setHeader('Allow', allowed);
  res.status(405).json({ error: 'Method not allowed' });
}

export function badRequest(res: VercelResponse, message: string) {
  res.status(400).json({ error: message });
}

export function unauthorized(res: VercelResponse, message = 'Unauthorized') {
  res.status(401).json({ error: message });
}

export function forbidden(res: VercelResponse, message = 'Forbidden') {
  res.status(403).json({ error: message });
}

export function serverError(res: VercelResponse, err: unknown) {
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[api]', err);
  res.status(500).json({ error: message });
}

export function getBotToken(): string {
  const token = process.env.BOT_TOKEN?.trim();
  if (!token) throw new Error('BOT_TOKEN is not configured');
  return token;
}

export function readJsonBody<T>(req: VercelRequest): T {
  return (req.body ?? {}) as T;
}
