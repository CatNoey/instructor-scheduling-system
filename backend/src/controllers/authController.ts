import { Request, Response } from 'express';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getJwtSecret, isRole } from '../config/env';
import { sendError } from '../middleware/errorResponse';
import { createUser, getUserByUsername } from '../models/User';

const validText = (value: unknown, minimum: number, maximum: number): value is string =>
  typeof value === 'string' && value.trim().length >= minimum && value.trim().length <= maximum;

const publicInstructorInput = (body: unknown) => {
  if (!body || typeof body !== 'object') return null;
  const candidate = body as Record<string, unknown>;
  if (candidate.role !== undefined && candidate.role !== 'instructor') return null;
  if (!validText(candidate.username, 3, 100) || !validText(candidate.email, 3, 254)) return null;
  if (typeof candidate.password !== 'string' || candidate.password.length < 8 || candidate.password.length > 128) return null;
  // Role is deliberately not accepted from this public endpoint.
  return { username: candidate.username.trim(), email: candidate.email.trim().toLowerCase(), password: candidate.password, role: 'instructor' as const };
};

export const register = async (req: Request, res: Response): Promise<void> => {
  if (req.body?.role === 'admin') {
    sendError(res, 403, 'ADMIN_REGISTRATION_DISABLED', 'Administrator accounts can only be created by the initialization command');
    return;
  }
  const input = publicInstructorInput(req.body);
  if (!input) {
    sendError(res, 400, 'INVALID_REGISTRATION', 'Username, email, and an 8-128 character password are required');
    return;
  }

  try {
    const newUser = await createUser(input);
    res.status(201).json({ success: true, data: { userId: newUser.id } });
  } catch (error) {
    if (error instanceof Error && error.name === 'SequelizeUniqueConstraintError') {
      sendError(res, 409, 'USER_EXISTS', 'Username or email already exists');
      return;
    }
    if (error instanceof Error && error.name === 'SequelizeValidationError') {
      sendError(res, 400, 'INVALID_REGISTRATION', 'Registration data is invalid');
      return;
    }
    sendError(res, 500, 'REGISTRATION_FAILED', 'Unable to register user');
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = req.body as Record<string, unknown>;
  if (!validText(body?.username, 1, 100) || typeof body?.password !== 'string') {
    sendError(res, 400, 'INVALID_LOGIN', 'Username and password are required');
    return;
  }

  try {
    const user = await getUserByUsername(body.username.trim());
    if (!user || !isRole(user.role) || !(await bcryptjs.compare(body.password, user.password))) {
      sendError(res, 401, 'INVALID_CREDENTIALS', 'Invalid username or password');
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      getJwtSecret(),
      { expiresIn: '1h' },
    );
    // This successful response is a pre-existing client contract.
    res.json({ token, user: { id: user.id, username: user.username, email: user.email, role: user.role } });
  } catch {
    sendError(res, 500, 'LOGIN_FAILED', 'Unable to log in');
  }
};
