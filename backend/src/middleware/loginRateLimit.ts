import { NextFunction, Request, Response } from 'express';
import { sendError } from './errorResponse';

interface Bucket { count: number; resetAt: number; }

export const createLoginRateLimiter = (limit = 5, windowMs = 15 * 60 * 1000) => {
  const attempts = new Map<string, Bucket>();

  return (req: Request, res: Response, next: NextFunction): void => {
    const now = Date.now();
    const username = typeof req.body?.username === 'string' ? req.body.username.trim().toLowerCase() : '';
    const key = `${req.ip}:${username}`;
    const current = attempts.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
    bucket.count += 1;
    attempts.set(key, bucket);

    if (bucket.count > limit) {
      res.setHeader('Retry-After', Math.ceil((bucket.resetAt - now) / 1000));
      sendError(res, 429, 'LOGIN_RATE_LIMITED', 'Too many login attempts; try again later');
      return;
    }
    next();
  };
};

export const loginRateLimiter = createLoginRateLimiter();
