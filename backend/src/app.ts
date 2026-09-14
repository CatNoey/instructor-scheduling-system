import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import authRoutes from './routes/auth';
import instructorApplicationRoutes from './routes/instructorApplicationRoutes';
import adminApplicationRoutes from './routes/adminApplicationRoutes';
import scheduleRoutes from './routes/scheduleRoutes';
import { sendError } from './middleware/errorResponse';
import './models/associations';

export interface AppOptions {
  corsAllowedOrigins?: string[];
  isReady?: () => boolean;
}

export const createApp = ({
  corsAllowedOrigins = ['http://localhost:3001'],
  isReady = () => false,
}: AppOptions = {}) => {
  const app = express();
  const allowedOrigins = new Set(corsAllowedOrigins);

  app.use(cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) return callback(null, true);
      return callback(new Error('Origin is not allowed by CORS'));
    },
    credentials: true,
  }));
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.get('/readiness', (_req, res) => {
    if (isReady()) return res.json({ success: true, data: { status: 'ready' } });
    return sendError(res, 503, 'DATABASE_UNAVAILABLE', 'Database is not ready');
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/schedules', scheduleRoutes);
  app.use('/api', adminApplicationRoutes);
  app.use('/api', instructorApplicationRoutes);

  app.get('/', (_req, res) => res.json({ success: true, data: { message: 'Instructor Scheduling API' } }));
  app.use((_req: Request, res: Response) => sendError(res, 404, 'NOT_FOUND', 'Route not found'));
  app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (error.message === 'Origin is not allowed by CORS') {
      sendError(res, 403, 'CORS_ORIGIN_DENIED', 'Origin is not allowed');
      return;
    }
    console.error('Unhandled request error', error);
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  });

  return app;
};
