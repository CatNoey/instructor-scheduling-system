import dotenv from 'dotenv';

dotenv.config();

export type Role = 'admin' | 'instructor';

export interface AppConfig {
  port: number;
  jwtSecret: string;
  corsAllowedOrigins: string[];
}

const required = (name: string, value: string | undefined): string => {
  if (!value || value.trim().length === 0 || value.startsWith('your_')) {
    throw new Error(`${name} must be configured`);
  }
  return value;
};

export const getAppConfig = (environment: NodeJS.ProcessEnv = process.env): AppConfig => {
  required('DB_USER', environment.DB_USER);
  required('DB_HOST', environment.DB_HOST);
  required('DB_NAME', environment.DB_NAME);
  required('DB_PASSWORD', environment.DB_PASSWORD);
  const jwtSecret = required('JWT_SECRET', environment.JWT_SECRET);
  if (jwtSecret.length < 32) throw new Error('JWT_SECRET must be at least 32 characters');

  const port = Number.parseInt(environment.PORT || '3000', 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be a valid TCP port');

  const corsAllowedOrigins = required('CORS_ALLOWED_ORIGINS', environment.CORS_ALLOWED_ORIGINS)
    .split(',').map((origin) => origin.trim()).filter(Boolean);
  if (corsAllowedOrigins.length === 0) throw new Error('CORS_ALLOWED_ORIGINS must contain at least one origin');

  return { port, jwtSecret, corsAllowedOrigins };
};

export const getJwtSecret = (): string => required('JWT_SECRET', process.env.JWT_SECRET);
export const isRole = (value: unknown): value is Role => value === 'admin' || value === 'instructor';
