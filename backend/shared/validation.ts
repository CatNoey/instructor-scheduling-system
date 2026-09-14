export const trainingTypes = ['class', 'teacher', 'all_staff', 'remote', 'other'] as const;
export const scheduleStatuses = ['open', 'closed', 'adjusted'] as const;

export type TrainingType = (typeof trainingTypes)[number];
export type ScheduleStatus = (typeof scheduleStatuses)[number];

export const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parsePositiveInteger = (value: unknown): number | null => {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const stringValue = String(value);
  if (!/^\d+$/.test(stringValue)) return null;
  const parsed = Number(stringValue);
  return Number.isSafeInteger(parsed) && parsed > 0 ? parsed : null;
};

export const isDateOnly = (value: unknown): value is string => {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
};

/** Rejects timezone-less timestamps so the client must state the intended instant. */
export const parseOffsetIsoTimestamp = (value: unknown): Date | null => {
  if (typeof value !== 'string') return null;
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?(Z|[+-]\d{2}:\d{2})$/.exec(value);
  if (!match || !isDateOnly(match[1])) return null;
  const hour = Number(match[2]);
  const minute = Number(match[3]);
  const second = match[4] === undefined ? 0 : Number(match[4]);
  if (hour > 23 || minute > 59 || second > 59) return null;
  if (match[6] !== 'Z') {
    const [offsetHour, offsetMinute] = match[6].slice(1).split(':').map(Number);
    if (offsetHour > 23 || offsetMinute > 59) return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf()) ? null : parsed;
};

export const requiredString = (value: unknown): string | null =>
  typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;

export const optionalString = (value: unknown): string | null | undefined => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return typeof value === 'string' ? value.trim() : undefined;
};

export const isTrainingType = (value: unknown): value is TrainingType =>
  typeof value === 'string' && (trainingTypes as readonly string[]).includes(value);

export const isScheduleStatus = (value: unknown): value is ScheduleStatus =>
  typeof value === 'string' && (scheduleStatuses as readonly string[]).includes(value);
