jest.mock('../config/database', () => ({
  __esModule: true,
  default: { transaction: jest.fn((callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })) },
}));
jest.mock('../models/InstructorApplication', () => ({
  InstructorApplication: { create: jest.fn(), destroy: jest.fn(), findAll: jest.fn(), findByPk: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../models/Schedule', () => ({ Schedule: { findByPk: jest.fn() } }));
jest.mock('../models/Session', () => ({ Session: { findAll: jest.fn(), findByPk: jest.fn() } }));

import { InstructorApplicationController } from '../controllers/instructorApplicationController';
import { InstructorApplication } from '../models/InstructorApplication';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};
const request = (params = {}) => ({ params, user: { userId: 2, role: 'instructor' } } as any);
const futureSession = { id: 8, scheduleId: 4, startTime: new Date(Date.now() + 60_000), toJSON: () => ({ id: 8 }) };

describe('instructor application controller', () => {
  const controller = new InstructorApplicationController();
  beforeEach(() => jest.clearAllMocks());

  it('lists only future sessions from open schedules without a current application', async () => {
    (Session.findAll as jest.Mock).mockResolvedValue([]);
    const res = response();
    await controller.getAvailableSessions(request(), res as any);
    expect(Session.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ '$applications.id$': null }),
      include: expect.arrayContaining([expect.objectContaining({ where: { status: 'open' } })]),
    }));
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [] });
  });

  it('creates one pending application only for a future session on an open schedule', async () => {
    (Session.findByPk as jest.Mock).mockResolvedValue(futureSession);
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ status: 'open' });
    (InstructorApplication.findOne as jest.Mock).mockResolvedValue(null);
    (InstructorApplication.create as jest.Mock).mockResolvedValue({ toJSON: () => ({ id: 3, instructorId: 2, sessionId: 8, status: 'pending' }) });
    const res = response();
    await controller.applyForSession(request({ sessionId: '8' }), res as any);
    expect(InstructorApplication.create).toHaveBeenCalledWith({ instructorId: 2, sessionId: 8, status: 'pending' }, expect.anything());
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects past, closed, and duplicate applications with a conflict', async () => {
    (Session.findByPk as jest.Mock).mockResolvedValue({ ...futureSession, startTime: new Date(Date.now() - 1) });
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ status: 'open' });
    const pastResponse = response();
    await controller.applyForSession(request({ sessionId: '8' }), pastResponse as any);
    expect(pastResponse.status).toHaveBeenCalledWith(409);

    (Session.findByPk as jest.Mock).mockResolvedValue(futureSession);
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ status: 'closed' });
    const closedResponse = response();
    await controller.applyForSession(request({ sessionId: '8' }), closedResponse as any);
    expect(closedResponse.status).toHaveBeenCalledWith(409);

    (Schedule.findByPk as jest.Mock).mockResolvedValue({ status: 'open' });
    (InstructorApplication.findOne as jest.Mock).mockResolvedValue({ id: 3 });
    const duplicateResponse = response();
    await controller.applyForSession(request({ sessionId: '8' }), duplicateResponse as any);
    expect(duplicateResponse.status).toHaveBeenCalledWith(409);
  });

  it('allows only the owner to cancel a pending application and uses an atomic delete predicate', async () => {
    (InstructorApplication.findByPk as jest.Mock).mockResolvedValue({ id: 5, instructorId: 2, status: 'pending' });
    (InstructorApplication.destroy as jest.Mock).mockResolvedValue(1);
    const res = response();
    await controller.cancelApplication(request({ applicationId: '5' }), res as any);
    expect(InstructorApplication.destroy).toHaveBeenCalledWith({ where: { id: 5, instructorId: 2, status: 'pending' } });
    expect(res.json).toHaveBeenCalledWith({ success: true, data: null });

    (InstructorApplication.findByPk as jest.Mock).mockResolvedValue({ id: 5, instructorId: 9, status: 'pending' });
    const forbiddenResponse = response();
    await controller.cancelApplication(request({ applicationId: '5' }), forbiddenResponse as any);
    expect(forbiddenResponse.status).toHaveBeenCalledWith(403);
  });
});
