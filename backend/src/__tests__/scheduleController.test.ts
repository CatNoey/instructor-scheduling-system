import { createSchedule, deleteSchedule, updateSchedule } from '../controllers/scheduleController';
import { Schedule } from '../models/Schedule';

jest.mock('../models/Schedule', () => ({
  Schedule: Object.assign(jest.fn(), {
    destroy: jest.fn(),
    findByPk: jest.fn(),
  }),
}));

const response = () => {
  const res = { status: jest.fn(), json: jest.fn() };
  res.status.mockReturnValue(res);
  return res;
};

describe('schedule controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('creates a schedule from allowed input only', async () => {
    const save = jest.fn().mockResolvedValue({ id: 1 });
    (Schedule as unknown as jest.Mock).mockImplementation(() => ({ save }));
    const res = response();

    await createSchedule({ body: { date: '2026-10-01', institutionName: 'School', region: 'Seoul', capacity: 10, trainingType: 'class', status: 'open', ignored: true } } as any, res as any);

    expect(Schedule).toHaveBeenCalledWith(expect.not.objectContaining({ ignored: true }));
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: { id: 1 } });
  });

  it('returns 404 when updating an unknown schedule', async () => {
    (Schedule.findByPk as jest.Mock).mockResolvedValue(null);
    const res = response();
    await updateSchedule({ params: { id: '99' }, body: {} } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });

  it('returns 404 when deleting an unknown schedule', async () => {
    (Schedule.destroy as jest.Mock).mockResolvedValue(0);
    const res = response();
    await deleteSchedule({ params: { id: '99' } } as any, res as any);
    expect(res.status).toHaveBeenCalledWith(404);
  });
});
