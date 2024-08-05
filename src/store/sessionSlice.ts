// src/store/sessionSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Session, ApiResponse } from '../types';
import { getSessions, createSession, updateSession as updateSessionApi, deleteSession as deleteSessionApi } from '../services/api';

interface SessionState {
  items: Session[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: SessionState = {
  items: [],
  status: 'idle',
  error: null,
};

export const fetchSessions = createAsyncThunk<Session[], string, { rejectValue: string }>(
  'sessions/fetchSessions',
  async (scheduleId, { rejectWithValue }) => {
    try {
      const response = await getSessions(scheduleId);
      if (!response.data) {
        return rejectWithValue('No sessions found');
      }
      return response.data;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch sessions');
    }
  }
);

export const addSession = createAsyncThunk<Session, Omit<Session, 'id'>, { rejectValue: string }>(
  'sessions/addSession',
  async (session, { rejectWithValue }) => {
    try {
      const newSession = await createSession(session);
      return newSession;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to add session');
    }
  }
);

export const updateSession = createAsyncThunk<Session, Session, { rejectValue: string }>(
  'sessions/updateSession',
  async (session, { rejectWithValue }) => {
    try {
      const updatedSession = await updateSessionApi(session);
      return updatedSession;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to update session');
    }
  }
);

export const deleteSession = createAsyncThunk<{ scheduleId: string, sessionId: string }, { scheduleId: string, sessionId: string }, { rejectValue: string }>(
  'sessions/deleteSession',
  async ({ scheduleId, sessionId }, { rejectWithValue }) => {
    try {
      await deleteSessionApi(scheduleId, sessionId);
      return { scheduleId, sessionId };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to delete session');
    }
  }
);

const sessionSlice = createSlice({
  name: 'sessions',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSessions.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSessions.fulfilled, (state, action: PayloadAction<Session[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
      })
      .addCase(fetchSessions.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch sessions';
      })
      .addCase(addSession.fulfilled, (state, action: PayloadAction<Session>) => {
        state.items.push(action.payload);
      })
      .addCase(updateSession.fulfilled, (state, action: PayloadAction<Session>) => {
        const index = state.items.findIndex(session => session.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      })
      .addCase(deleteSession.fulfilled, (state, action: PayloadAction<{ scheduleId: string, sessionId: string }>) => {
        state.items = state.items.filter(session => session.id !== action.payload.sessionId);
      });
  },
});

export default sessionSlice.reducer;