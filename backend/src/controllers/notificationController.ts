import { Request, Response } from 'express';
import { UserNotification } from '../models/UserNotification';
import { asyncHandler, sendData, sendError } from '../../shared/apiResponse';
import { parsePositiveInteger } from '../../shared/validation';

const userId = (req: Request) => parsePositiveInteger(req.user?.userId);
const notificationId = (req: Request) => parsePositiveInteger(req.params.notificationId);
const invalid = (res: Response, message: string) => sendError(res, 400, 'VALIDATION_ERROR', message);

export const getNotifications = asyncHandler(async (req, res) => {
  const id = userId(req);
  if (!id) return invalid(res, 'User id must be a positive integer');
  const notifications = await UserNotification.findAll({
    where: { userId: id },
    order: [['createdAt', 'DESC'], ['id', 'DESC']],
    limit: 50,
  });
  return sendData(res, notifications);
});

export const markNotificationRead = asyncHandler(async (req, res) => {
  const id = userId(req);
  const targetId = notificationId(req);
  if (!id || !targetId) return invalid(res, 'User and notification ids must be positive integers');
  const notification = await UserNotification.findOne({ where: { id: targetId, userId: id } });
  if (!notification) return sendError(res, 404, 'NOT_FOUND', 'Notification not found');
  if (!notification.readAt) await notification.update({ readAt: new Date() });
  return sendData(res, notification);
});
