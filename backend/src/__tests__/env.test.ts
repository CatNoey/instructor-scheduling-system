import { getAppConfig } from '../config/env';

const validEnvironment = (): NodeJS.ProcessEnv => ({
  DB_USER: 'app',
  DB_HOST: '127.0.0.1',
  DB_NAME: 'app_test',
  DB_PASSWORD: 'password',
  JWT_SECRET: 'a-secret-value-that-is-at-least-thirty-two-characters',
  CORS_ALLOWED_ORIGINS: 'https://app.example.com, http://localhost:3001',
});

describe('startup configuration', () => {
  it('requires a non-placeholder JWT secret and normalizes CORS origins', () => {
    expect(getAppConfig(validEnvironment()).corsAllowedOrigins).toEqual(['https://app.example.com', 'http://localhost:3001']);
    const invalid = validEnvironment();
    delete invalid.JWT_SECRET;
    expect(() => getAppConfig(invalid)).toThrow('JWT_SECRET must be configured');
  });
});
