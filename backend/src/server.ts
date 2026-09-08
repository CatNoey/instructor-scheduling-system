// src/server.ts

import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import authRoutes from './routes/auth';
import scheduleRoutes from './routes/scheduleRoutes';
import sequelize from './config/database';
import path from 'path';

console.log('Current working directory:', process.cwd());
console.log('Attempting to load .env file from:', path.resolve(process.cwd(), '.env'));

dotenv.config();

console.log('Environment variables:', {
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  DB_USER: process.env.DB_USER,
  DB_HOST: process.env.DB_HOST,
  DB_NAME: process.env.DB_NAME,
  DB_PORT: process.env.DB_PORT,
});

const app = express();

app.use(cors({
  origin: 'http://localhost:3001',
  credentials: true
}));

app.use(express.json());

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/schedules', scheduleRoutes);

const port = process.env.PORT || 3000;

sequelize.sync({ alter: true }).then(() => {
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`CORS is enabled for origin: http://localhost:3001`);
  });
}).catch((error) => {
  console.error('Unable to sync database:', error);
});

// Add a catch-all route for unhandled requests
app.use((req: Request, res: Response) => {
  console.log(`Unhandled request: ${req.method} ${req.url}`);
  res.status(404).json({ message: 'Not Found' });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

export default app;