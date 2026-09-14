import { Response } from 'express';

export const sendError = (res: Response, status: number, code: string, message: string): Response =>
  res.status(status).json({ success: false, error: { code, message } });
