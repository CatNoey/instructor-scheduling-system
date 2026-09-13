jest.mock('../services/api', () => ({
  getSessions: jest.fn(), createSession: jest.fn(), updateSession: jest.fn(), deleteSession: jest.fn(),
  getAvailableSessions: jest.fn(), applyForSession: jest.fn(), cancelApplication: jest.fn(), getInstructorApplications: jest.fn(),
}));

import reducer, { fetchSessions } from './sessionSlice';
import { Session } from '../types';

const session = (id: number, scheduleId: number): Session => ({
  id, scheduleId, startTime: '2026-10-01T00:00:00.000Z', endTime: '2026-10-01T01:00:00.000Z',
  instructor: 'Alex', notes: null, trainingType: 'class',
});

describe('session selection requests', () => {
  it('keeps the newest selected schedule when an older request resolves last', () => {
    let state = reducer(undefined, fetchSessions.pending('older', 1));
    state = reducer(state, fetchSessions.pending('newer', 2));
    state = reducer(state, fetchSessions.fulfilled([session(1, 1)], 'older', 1));
    state = reducer(state, fetchSessions.fulfilled([session(2, 2)], 'newer', 2));
    expect(state.selectedScheduleId).toBe(2);
    expect(state.items).toEqual([session(2, 2)]);
  });
});
