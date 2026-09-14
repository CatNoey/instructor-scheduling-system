jest.mock('../models/UserNotification', () => ({
  UserNotification: { findAll: jest.fn(), findOne: jest.fn() },
}));

import { getNotifications, markNotificationRead } from '../controllers/notificationController';
import { UserNotification } from '../models/UserNotification';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const request = (params = {}, userId = 7) => ({ params, user: { userId } } as any);

describe('notification controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns the signed-in user notifications newest first', async () => {
    const notices = [{ id: 2 }, { id: 1 }];
    (UserNotification.findAll as jest.Mock).mockResolvedValue(notices);
    const res = response();

    await getNotifications(request(), res as any);

    expect(UserNotification.findAll).toHaveBeenCalledWith({
      where: { userId: 7 }, order: [['createdAt', 'DESC'], ['id', 'DESC']], limit: 50,
    });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: notices });
  });

  it('marks only the signed-in user notification as read', async () => {
    const notice = { id: 12, readAt: null, update: jest.fn().mockResolvedValue(undefined) };
    (UserNotification.findOne as jest.Mock).mockResolvedValue(notice);
    const res = response();

    await markNotificationRead(request({ notificationId: '12' }), res as any);

    expect(UserNotification.findOne).toHaveBeenCalledWith({ where: { id: 12, userId: 7 } });
    expect(notice.update).toHaveBeenCalledWith({ readAt: expect.any(Date) });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: notice });
  });

  it('does not expose another user notification', async () => {
    (UserNotification.findOne as jest.Mock).mockResolvedValue(null);
    const res = response();

    await markNotificationRead(request({ notificationId: '12' }), res as any);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
