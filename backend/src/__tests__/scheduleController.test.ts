jest.mock('../config/database', () => ({
  __esModule: true,
  default: {
    transaction: jest.fn((callback) => callback({ LOCK: { UPDATE: 'UPDATE' } })),
  },
}));

jest.mock('../models/Schedule', () => ({
  Schedule: {
    create: jest.fn(),
    destroy: jest.fn(),
    findAll: jest.fn(),
    findByPk: jest.fn(),
  },
}));

import { createSchedule, deleteSchedule, getSchedules, updateSchedule } from '../controllers/scheduleController';
import { Schedule } from '../models/Schedule';

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('schedule controller', () => {
  beforeEach(() => jest.clearAllMocks());

  const validInput = {
    date: '2026-10-01', institutionName: 'School', region: 'Seoul', capacity: 10, trainingType: 'class', status: 'open',
  };

  it('creates a schedule from allowed input only', async () => {
    (Schedule.create as jest.Mock).mockResolvedValue({ id: 1 });
    const res = response();
    await createSchedule({ body: { ...validInput, id: 44, createdAt: 'nope', ignored: true } } as any, res as any);
    expect(Schedule.create).toHaveBeenCalledWith(validInput);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('rejects invalid date and non-positive capacity before persistence', async () => {
    const res = response();
    await createSchedule({ body: { ...validInput, date: '2026-02-30' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: false, error: expect.objectContaining({ code: 'VALIDATION_ERROR' }) }));

    const capacityResponse = response();
    await createSchedule({ body: { ...validInput, capacity: 0 } } as any, capacityResponse as any);
    expect(capacityResponse.status).toHaveBeenCalledWith(400);
    expect(Schedule.create).not.toHaveBeenCalled();
  });

  it('returns an enveloped schedule list', async () => {
    (Schedule.findAll as jest.Mock).mockResolvedValue([{ id: 1 }]);
    const res = response();
    await getSchedules({} as any, res as any);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: [{ id: 1 }] });
  });

  it('does not let update input overwrite server-managed fields', async () => {
    const update = jest.fn().mockResolvedValue(undefined);
    (Schedule.findByPk as jest.Mock).mockResolvedValue({ update, id: 1 });
    const res = response();
    await updateSchedule({ params: { id: '1' }, body: { status: 'closed', id: 999, createdAt: 'bad' } } as any, res as any);
    expect(update).toHaveBeenCalledWith({ status: 'closed' }, expect.anything());
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it('returns 404 when updating or deleting an unknown schedule', async () => {
    (Schedule.findByPk as jest.Mock).mockResolvedValue(null);
    const updateResponse = response();
    await updateSchedule({ params: { id: '99' }, body: {} } as any, updateResponse as any);
    expect(updateResponse.status).toHaveBeenCalledWith(404);

    (Schedule.destroy as jest.Mock).mockResolvedValue(0);
    const deleteResponse = response();
    await deleteSchedule({ params: { id: '99' } } as any, deleteResponse as any);
    expect(deleteResponse.status).toHaveBeenCalledWith(404);
  });
});
