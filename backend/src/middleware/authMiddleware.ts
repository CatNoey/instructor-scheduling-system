import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { getJwtSecret, isRole, Role } from '../config/env';
import { sendError } from './errorResponse';

export interface JwtPayload {
  userId: number;
  username: string;
  role: Role;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

const isValidPayload = (payload: unknown): payload is JwtPayload => {
  if (!payload || typeof payload !== 'object') return false;
  const candidate = payload as Record<string, unknown>;
  return Number.isSafeInteger(candidate.userId)
    && (candidate.userId as number) > 0
    && typeof candidate.username === 'string'
    && candidate.username.length > 0
    && isRole(candidate.role);
};

export const verifyToken = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.header('Authorization');
  const match = authorization?.match(/^Bearer\s+([^\s]+)$/);
  if (!match) {
    sendError(res, 401, 'AUTHENTICATION_REQUIRED', 'A valid Bearer token is required');
    return;
  }

  try {
    const decoded = jwt.verify(match[1], getJwtSecret());
    if (!isValidPayload(decoded)) {
      sendError(res, 401, 'INVALID_TOKEN', 'Token payload is invalid');
      return;
    }
    req.user = decoded;
    next();
  } catch {
    sendError(res, 401, 'INVALID_TOKEN', 'Token is invalid or expired');
  }
};

export const requireRole = (...roles: Role[]) => (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user || !roles.includes(req.user.role)) {
    sendError(res, 403, 'FORBIDDEN', 'You do not have permission to perform this action');
    return;
  }
  next();
};
