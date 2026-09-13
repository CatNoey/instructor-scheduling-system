jest.mock('../models/Schedule', () => ({ Schedule: { findByPk: jest.fn() } }));
jest.mock('../models/Session', () => ({ Session: { create: jest.fn(), destroy: jest.fn(), findAll: jest.fn(), findOne: jest.fn() } }));

import { createSession, getSessions, updateSession } from '../controllers/sessionController';
import { Schedule } from '../models/Schedule';
import { Session } from '../models/Session';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

const validInput = {
  startTime: '2026-10-01T09:00:00+09:00',
  endTime: '2026-10-01T10:00:00+09:00',
  instructor: 'Kim',
  trainingType: 'class',
};

describe('session controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('requires an existing parent and only persists allowed fields', async () => {
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ id: 7 });
    (Session.create as jest.Mock).mockResolvedValue({ id: 3 });
    const res = response();
    await createSession({ params: { scheduleId: '7' }, body: { ...validInput, scheduleId: 99, id: 4, createdAt: 'bad' } } as any, res as any);
    expect(Session.create).toHaveBeenCalledWith(expect.objectContaining({ scheduleId: 7, instructor: 'Kim' }));
    expect(Session.create).toHaveBeenCalledWith(expect.not.objectContaining({ id: 4, createdAt: 'bad' }));
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it('rejects timezone-less, invalid, and backwards time ranges', async () => {
    const missingOffset = response();
    await createSession({ params: { scheduleId: '7' }, body: { ...validInput, startTime: '2026-10-01T09:00:00' } } as any, missingOffset as any);
    expect(missingOffset.status).toHaveBeenCalledWith(400);

    const backwards = response();
    await createSession({ params: { scheduleId: '7' }, body: { ...validInput, endTime: '2026-10-01T08:00:00+09:00' } } as any, backwards as any);
    expect(backwards.status).toHaveBeenCalledWith(400);
  });

  it('returns 404 when the parent or child does not match', async () => {
    (Schedule.findByPk as jest.Mock).mockResolvedValue(null);
    const listResponse = response();
    await getSessions({ params: { scheduleId: '7' } } as any, listResponse as any);
    expect(listResponse.status).toHaveBeenCalledWith(404);

    (Session.findOne as jest.Mock).mockResolvedValue(null);
    const updateResponse = response();
    await updateSession({ params: { scheduleId: '7', sessionId: '8' }, body: { instructor: 'Lee' } } as any, updateResponse as any);
    expect(Session.findOne).toHaveBeenCalledWith({ where: { id: 8, scheduleId: 7 } });
    expect(updateResponse.status).toHaveBeenCalledWith(404);
  });

  it('forwards unexpected database errors to Express error middleware', async () => {
    (Schedule.findByPk as jest.Mock).mockRejectedValue(new Error('database unavailable'));
    const next = jest.fn();
    await getSessions({ params: { scheduleId: '7' } } as any, response() as any, next);
    expect(next).toHaveBeenCalledWith(expect.any(Error));
  });
});
