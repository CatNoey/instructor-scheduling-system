import normalizeScheduleDate from '../migrations/003-normalize-schedule-date';

describe('schedule date normalization migration', () => {
  it('converts a legacy timestamp column to a business date', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    await normalizeScheduleDate.up({
      describeTable: jest.fn().mockResolvedValue({ date: { type: 'TIMESTAMP WITH TIME ZONE' } }),
      sequelize: { query },
    } as any, {} as any);
    expect(query).toHaveBeenCalledWith(
      'ALTER TABLE "Schedules" ALTER COLUMN "date" TYPE DATE USING ("date"::date)',
      { transaction: {} },
    );
  });

  it('does nothing when the database already has a DATE column', async () => {
    const query = jest.fn();
    await normalizeScheduleDate.up({
      describeTable: jest.fn().mockResolvedValue({ date: { type: 'DATE' } }),
      sequelize: { query },
    } as any, {} as any);
    expect(query).not.toHaveBeenCalled();
  });
});
