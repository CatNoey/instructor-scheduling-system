import jwt from 'jsonwebtoken';
import { requireRole, verifyToken } from '../middleware/authMiddleware';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('authentication middleware', () => {
  it('requires an exact Bearer authorization format', () => {
    const res = response();
    verifyToken({ header: () => 'Token abc' } as any, res as any, jest.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'AUTHENTICATION_REQUIRED' }) }));
  });

  it('accepts only payloads with numeric IDs and supported roles', () => {
    const token = jwt.sign({ userId: 12, username: 'admin', role: 'admin' }, process.env.JWT_SECRET!, { expiresIn: '1h' });
    const req = { header: () => `Bearer ${token}` } as any;
    const next = jest.fn();
    verifyToken(req, response() as any, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(req.user).toEqual(expect.objectContaining({ userId: 12, role: 'admin' }));
  });

  it('returns the unified forbidden response for a wrong role', () => {
    const res = response();
    requireRole('admin')({ user: { userId: 2, username: 'teacher', role: 'instructor' } } as any, res as any, jest.fn());
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ success: false, error: { code: 'FORBIDDEN', message: 'You do not have permission to perform this action' } });
  });
});
