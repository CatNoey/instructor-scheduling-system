import request from 'supertest';
import { createApp } from '../app';

describe('application lifecycle routes', () => {
  it('reports health without a database connection and readiness separately', async () => {
    const app = createApp({ isReady: () => false });
    await request(app).get('/health').expect(200, { success: true, data: { status: 'ok' } });
    await request(app).get('/readiness').expect(503, {
      success: false,
      error: { code: 'DATABASE_UNAVAILABLE', message: 'Database is not ready' },
    });
  });
});
