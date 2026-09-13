/**
 * The schedule date is a business date (YYYY-MM-DD), while session values are
 * instants. The current MVP combines these using the browser's local timezone.
 * A fixed business timezone needs a product decision before this is changed.
 */
export const localTimeToIso = (date: string, time: string): string => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    throw new Error('A valid date and time are required');
  }
  const local = new Date(`${date}T${time}:00`);
  if (Number.isNaN(local.valueOf())) throw new Error('A valid date and time are required');
  return local.toISOString();
};

export const isoToLocalTime = (iso: string): string => {
  const value = new Date(iso);
  if (Number.isNaN(value.valueOf())) return '';
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
};

export const businessDateToLocalDate = (date: string): Date => {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
};
