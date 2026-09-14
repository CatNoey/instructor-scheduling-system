jest.mock('../config/database', () => ({
  __esModule: true,
  default: { transaction: jest.fn((callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })) },
}));
jest.mock('../models/InstructorApplication', () => ({
  InstructorApplication: { count: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../models/Schedule', () => ({ Schedule: { findByPk: jest.fn() } }));
jest.mock('../models/Session', () => ({ Session: { findByPk: jest.fn() } }));
jest.mock('../models/User', () => ({ User: { findByPk: jest.fn() } }));

import { getScheduleApplications, reviewApplication } from '../controllers/adminApplicationController';
import { InstructorApplication } from '../models/InstructorApplication';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';
import { User } from '../models/User';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const request = (params = {}, body = {}) => ({ params, body, user: { userId: 1, role: 'admin' } } as any);
const session = { id: 8, scheduleId: 4, startTime: new Date('2026-10-01T00:00:00.000Z'), endTime: new Date('2026-10-01T01:00:00.000Z') };
const pendingApplication = { id: 3, instructorId: 7, sessionId: 8, status: 'pending', update: jest.fn() };

describe('admin application controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('lists a schedule application queue in first-come order', async () => {
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ id: 4 });
    (InstructorApplication.findAll as jest.Mock).mockResolvedValue([]);
    const res = response();
    await getScheduleApplications(request({ scheduleId: '4' }), res as any);
    expect(InstructorApplication.findAll).toHaveBeenCalledWith(expect.objectContaining({
      order: [['createdAt', 'ASC'], ['id', 'ASC']],
      include: expect.arrayContaining([expect.objectContaining({ where: { scheduleId: 4 } })]),
    }));
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('approves a pending application only when capacity and time-conflict checks pass', async () => {
    (InstructorApplication.findByPk as jest.Mock)
      .mockResolvedValueOnce(pendingApplication)
      .mockResolvedValueOnce({ id: 3, status: 'approved' });
    (User.findByPk as jest.Mock).mockResolvedValue({ id: 7 });
    (Session.findByPk as jest.Mock).mockResolvedValue(session);
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ id: 4, capacity: 2 });
    (InstructorApplication.count as jest.Mock).mockResolvedValue(1);
    (InstructorApplication.findOne as jest.Mock).mockResolvedValue(null);
    const res = response();
    await reviewApplication(request({ applicationId: '3' }, { status: 'approved' }), res as any);
    expect(InstructorApplication.count).toHaveBeenCalledWith(expect.objectContaining({ where: { status: 'approved' } }));
    expect(InstructorApplication.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ instructorId: 7, status: 'approved' }) }));
    expect(pendingApplication.update).toHaveBeenCalledWith({ status: 'approved' }, expect.anything());
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 3, status: 'approved' } });
  });

  it('rejects approval when the schedule is full or the instructor has an overlapping assignment', async () => {
    (InstructorApplication.findByPk as jest.Mock).mockResolvedValue(pendingApplication);
    (User.findByPk as jest.Mock).mockResolvedValue({ id: 7 });
    (Session.findByPk as jest.Mock).mockResolvedValue(session);
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ id: 4, capacity: 1 });
    (InstructorApplication.count as jest.Mock).mockResolvedValue(1);
    const fullResponse = response();
    await reviewApplication(request({ applicationId: '3' }, { status: 'approved' }), fullResponse as any);
    expect(fullResponse.status).toHaveBeenCalledWith(409);

    (InstructorApplication.count as jest.Mock).mockResolvedValue(0);
    (InstructorApplication.findOne as jest.Mock).mockResolvedValue({ id: 99 });
    const conflictResponse = response();
    await reviewApplication(request({ applicationId: '3' }, { status: 'approved' }), conflictResponse as any);
    expect(conflictResponse.status).toHaveBeenCalledWith(409);
  });
});
