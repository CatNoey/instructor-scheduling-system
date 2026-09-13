import { initialSchemaMigration } from '../config/migrations/001-initial-schema';

it('creates the initial tables with date-only schedules and cascade relations', async () => {
  const createTable = jest.fn().mockResolvedValue(undefined);
  await initialSchemaMigration.up({ createTable } as any, {} as any);

  expect(createTable.mock.calls.map(([name]) => name)).toEqual(['Users', 'Schedules', 'Sessions', 'InstructorApplications']);
  const schedules = createTable.mock.calls[1][1];
  const sessions = createTable.mock.calls[2][1];
  expect(String(schedules.date.type)).toContain('DATEONLY');
  expect(sessions.scheduleId.onDelete).toBe('CASCADE');
});
