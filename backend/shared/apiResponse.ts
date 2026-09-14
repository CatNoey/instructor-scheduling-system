import { NextFunction, Request, Response } from 'express';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'CAPACITY_REACHED'
  | 'TIME_CONFLICT'
  | 'INTERNAL_ERROR';

export type AsyncRequestHandler = (req: Request, res: Response, next?: NextFunction) => Promise<void>;

export const sendData = <T>(res: Response, data: T, status = 200): Response =>
  res.status(status).json({ success: true, data });

export const sendError = (
  res: Response,
  status: number,
  code: ApiErrorCode,
  message: string,
): Response => res.status(status).json({ success: false, error: { code, message } });

/**
 * Express 4 does not forward rejected async handlers to its error middleware.
 * Controllers use this boundary so unexpected database failures get the single
 * global 500 response without disclosing an internal error message.
 */
export const asyncHandler = (
  handler: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
): AsyncRequestHandler => async (req, res, next) => {
  const forward: NextFunction = next ?? (() => {
    sendError(res, 500, 'INTERNAL_ERROR', 'Internal server error');
  });
  try {
    await handler(req, res, forward);
  } catch (error) {
    forward(error);
  }
};
