import { createLoginRateLimiter } from '../middleware/loginRateLimit';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn(), setHeader: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

it('limits repeated login attempts per IP and username', () => {
  const limiter = createLoginRateLimiter(2, 60_000);
  const req = { ip: '127.0.0.1', body: { username: 'user' } } as any;
  const next = jest.fn();
  limiter(req, response() as any, next);
  limiter(req, response() as any, next);
  const blocked = response();
  limiter(req, blocked as any, next);

  expect(next).toHaveBeenCalledTimes(2);
  expect(blocked.status).toHaveBeenCalledWith(429);
  expect(blocked.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.objectContaining({ code: 'LOGIN_RATE_LIMITED' }) }));
});
