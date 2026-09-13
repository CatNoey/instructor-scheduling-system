import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { login, register } from '../controllers/authController';
import { createUser, getUserByUsername } from '../models/User';

jest.mock('../models/User', () => ({
  createUser: jest.fn(),
  getUserByUsername: jest.fn(),
}));
jest.mock('bcryptjs', () => ({ compare: jest.fn() }));

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('authentication controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates an instructor while excluding server-managed fields', async () => {
    (createUser as jest.Mock).mockResolvedValue({ id: 7 });
    const res = response();

    await register({ body: { username: 'new-user', email: 'NEW@example.com', password: 'correct-password', role: 'instructor', id: 99 } } as any, res as any);

    expect(createUser).toHaveBeenCalledWith(expect.objectContaining({ role: 'instructor', email: 'new@example.com' }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { userId: 7 } });
  });

  it('blocks public administrator registration', async () => {
    const res = response();
    await register({ body: { username: 'admin', email: 'admin@example.com', password: 'correct-password', role: 'admin' } } as any, res as any);
    expect(createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ code: 'ADMIN_REGISTRATION_DISABLED' }) }));
  });

  it('rejects an invalid public registration password', async () => {
    const res = response();
    await register({ body: { username: 'new-user', email: 'new@example.com', password: 'short' } } as any, res as any);
    expect(createUser).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
  });

  it('keeps the successful login token and user contract', async () => {
    (getUserByUsername as jest.Mock).mockResolvedValue({ id: 4, username: 'instructor', email: 'i@example.com', password: 'hash', role: 'instructor' });
    (bcryptjs.compare as jest.Mock).mockResolvedValue(true);
    const res = response();

    await login({ body: { username: 'instructor', password: 'correct-password' } } as any, res as any);

    const payload = jwt.verify(res.json.mock.calls[0][0].token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    expect(payload.userId).toBe(4);
    expect(payload.role).toBe('instructor');
    expect(res.json.mock.calls[0][0].user).toEqual({ id: 4, username: 'instructor', email: 'i@example.com', role: 'instructor' });
  });
});
