import axios from 'axios';
import authService from './authService';

jest.mock('axios', () => ({ __esModule: true, default: { post: jest.fn() } }));
const mockedAxios = axios as jest.Mocked<typeof axios>;
const token = (exp: number) => `header.${btoa(JSON.stringify({ exp })).replace(/=/g, '')}.signature`;
const instructor = { id: 7, username: 'instructor', email: 'instructor@example.test', role: 'instructor' as const };

describe('stored authentication', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('removes expired tokens and their associated user data', () => {
    localStorage.setItem('token', token(Math.floor(Date.now() / 1000) - 1));
    localStorage.setItem('user', JSON.stringify(instructor));
    expect(authService.getCurrentUser()).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('replaces persisted identity when another account logs in', async () => {
    localStorage.setItem('token', token(Math.floor(Date.now() / 1000) + 3600));
    localStorage.setItem('user', JSON.stringify(instructor));
    const admin = { id: 1, username: 'admin', email: 'admin@example.test', role: 'admin' as const };
    mockedAxios.post.mockResolvedValueOnce({ data: { user: admin, token: token(Math.floor(Date.now() / 1000) + 3600) } });
    await authService.login({ username: 'admin', password: 'password' });
    expect(authService.getCurrentUser()).toEqual(admin);
  });
});
