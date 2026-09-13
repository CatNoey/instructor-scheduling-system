import { businessDateToLocalDate, isoToLocalTime, localTimeToIso } from './dateTime';

describe('session date and time conversion', () => {
  it('combines a business date and time in the browser local timezone', () => {
    const iso = localTimeToIso('2026-10-01', '09:30');
    const value = new Date(iso);
    expect(value.getFullYear()).toBe(2026);
    expect(value.getMonth()).toBe(9);
    expect(value.getDate()).toBe(1);
    expect(value.getHours()).toBe(9);
    expect(value.getMinutes()).toBe(30);
  });

  it('turns an API UTC ISO timestamp back into a time-input value', () => {
    const local = new Date(2026, 9, 1, 14, 5).toISOString();
    expect(isoToLocalTime(local)).toBe('14:05');
  });

  it('does not parse a business date as UTC', () => {
    const value = businessDateToLocalDate('2026-10-01');
    expect(value.getFullYear()).toBe(2026);
    expect(value.getMonth()).toBe(9);
    expect(value.getDate()).toBe(1);
  });
});
