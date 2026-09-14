import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { InstructorApplication, Session, SessionInput } from '../types';
import { getSessions, createSession, updateSession as updateSessionApi, deleteSession as deleteSessionApi, getAvailableSessions, applyForSession as applyForSessionApi, cancelApplication as cancelApplicationApi, getInstructorApplications } from '../services/api';

interface SessionState {
  items: Session[];
  selectedScheduleId: number | null;
  availableSessions: Session[];
  instructorApplications: InstructorApplication[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  applyingSessionIds: number[];
  cancellingApplicationIds: number[];
}
const initialState: SessionState = { items: [], selectedScheduleId: null, availableSessions: [], instructorApplications: [], status: 'idle', error: null, applyingSessionIds: [], cancellingApplicationIds: [] };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : '처리 중 알 수 없는 오류가 발생했습니다.';

export const fetchSessions = createAsyncThunk<Session[], number, { rejectValue: string }>(
  'sessions/fetchSessions', async (scheduleId, { rejectWithValue }) => {
    try { return await getSessions(scheduleId); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const fetchAvailableSessions = createAsyncThunk<Session[], void, { rejectValue: string }>(
  'sessions/fetchAvailableSessions', async (_, { rejectWithValue }) => {
    try { return await getAvailableSessions(); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const fetchInstructorApplications = createAsyncThunk<InstructorApplication[], void, { rejectValue: string }>(
  'sessions/fetchInstructorApplications', async (_, { rejectWithValue }) => {
    try { return await getInstructorApplications(); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const applyForSession = createAsyncThunk<InstructorApplication, number, { rejectValue: string }>(
  'sessions/applyForSession', async (sessionId, { rejectWithValue }) => {
    try { return await applyForSessionApi(sessionId); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const cancelApplication = createAsyncThunk<number, number, { rejectValue: string }>(
  'sessions/cancelApplication', async (applicationId, { rejectWithValue }) => {
    try { await cancelApplicationApi(applicationId); return applicationId; } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const addSession = createAsyncThunk<Session, SessionInput, { rejectValue: string }>(
  'sessions/addSession', async (session, { rejectWithValue }) => {
    try { return await createSession(session); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const updateSession = createAsyncThunk<Session, Session, { rejectValue: string }>(
  'sessions/updateSession', async (session, { rejectWithValue }) => {
    try { return await updateSessionApi(session); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const deleteSession = createAsyncThunk<{ scheduleId: number; sessionId: number }, { scheduleId: number; sessionId: number }, { rejectValue: string }>(
  'sessions/deleteSession', async ({ scheduleId, sessionId }, { rejectWithValue }) => {
    try { await deleteSessionApi(scheduleId, sessionId); return { scheduleId, sessionId }; } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);

const sessionSlice = createSlice({
  name: 'sessions', initialState,
  reducers: {
    resetSessions: () => initialState,
    clearSessionError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => builder
    .addCase(fetchSessions.pending, (state, action) => { state.status = 'loading'; state.error = null; state.selectedScheduleId = action.meta.arg; })
    .addCase(fetchSessions.fulfilled, (state, action) => {
      // Ignore a stale response after the user selected another schedule.
      if (state.selectedScheduleId === action.meta.arg) { state.status = 'succeeded'; state.items = action.payload; }
    })
    .addCase(fetchSessions.rejected, (state, action) => { if (state.selectedScheduleId === action.meta.arg) { state.status = 'failed'; state.error = action.payload || '세션 목록을 불러오지 못했습니다.'; } })
    .addCase(fetchAvailableSessions.fulfilled, (state, action) => { state.availableSessions = action.payload; })
    .addCase(fetchAvailableSessions.rejected, (state, action) => { state.error = action.payload || '지원 가능한 세션을 불러오지 못했습니다.'; })
    .addCase(fetchInstructorApplications.fulfilled, (state, action) => { state.instructorApplications = action.payload; })
    .addCase(fetchInstructorApplications.rejected, (state, action) => { state.error = action.payload || '지원 내역을 불러오지 못했습니다.'; })
    .addCase(applyForSession.pending, (state, action) => { state.applyingSessionIds.push(action.meta.arg); state.error = null; })
    .addCase(applyForSession.fulfilled, (state, action) => { state.instructorApplications.push(action.payload); state.applyingSessionIds = state.applyingSessionIds.filter((id) => id !== action.meta.arg); })
    .addCase(applyForSession.rejected, (state, action) => { state.applyingSessionIds = state.applyingSessionIds.filter((id) => id !== action.meta.arg); state.error = action.payload || '세션 지원을 완료하지 못했습니다.'; })
    .addCase(cancelApplication.pending, (state, action) => { state.cancellingApplicationIds.push(action.meta.arg); state.error = null; })
    .addCase(cancelApplication.fulfilled, (state, action) => { state.instructorApplications = state.instructorApplications.filter((app) => app.id !== action.payload); state.cancellingApplicationIds = state.cancellingApplicationIds.filter((id) => id !== action.meta.arg); })
    .addCase(cancelApplication.rejected, (state, action) => { state.cancellingApplicationIds = state.cancellingApplicationIds.filter((id) => id !== action.meta.arg); state.error = action.payload || '지원 취소를 완료하지 못했습니다.'; })
    .addCase(addSession.fulfilled, (state, action) => { if (state.selectedScheduleId === action.payload.scheduleId) state.items.push(action.payload); })
    .addCase(updateSession.fulfilled, (state, action) => { const index = state.items.findIndex((session) => session.id === action.payload.id); if (index !== -1) state.items[index] = action.payload; })
    .addCase(deleteSession.fulfilled, (state, action) => { state.items = state.items.filter((session) => session.id !== action.payload.sessionId); }),
});
export const { resetSessions, clearSessionError } = sessionSlice.actions;
export default sessionSlice.reducer;
