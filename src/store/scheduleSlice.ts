// src/store/scheduleSlice.ts

import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Schedule } from '../types';
import { 
  createSchedule as apiCreateSchedule, 
  getSchedules as apiGetSchedules, 
  updateSchedule as apiUpdateSchedule, 
  deleteSchedule as apiDeleteSchedule 
} from '../services/api';

interface ScheduleState {
  items: Schedule[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isAdding: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}

const initialState: ScheduleState = {
  items: [],
  status: 'idle',
  error: null,
  isAdding: false,
  isUpdating: false,
  isDeleting: false,
};

export const fetchSchedules = createAsyncThunk<Schedule[], void, { rejectValue: string }>(
  'schedules/fetchSchedules',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiGetSchedules();
      console.log('API response:', response);
      return response;
    } catch (error: unknown) {
      console.error('Error fetching schedules:', error);
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred while fetching schedules');
    }
  }
);

export const addSchedule = createAsyncThunk<Schedule, Omit<Schedule, 'id' | 'createdBy'>, { rejectValue: string }>(
  'schedules/addSchedule',
  async (schedule, { rejectWithValue }) => {
    try {
      const response = await apiCreateSchedule(schedule);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const updateSchedule = createAsyncThunk<Schedule, Schedule, { rejectValue: string }>(
  'schedules/updateSchedule',
  async (schedule, { rejectWithValue }) => {
    try {
      const response = await apiUpdateSchedule(schedule.id, schedule);
      return response;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

export const deleteSchedule = createAsyncThunk<string, string, { rejectValue: string }>(
  'schedules/deleteSchedule',
  async (scheduleId, { rejectWithValue }) => {
    try {
      await apiDeleteSchedule(scheduleId);
      return scheduleId;
    } catch (error: unknown) {
      if (error instanceof Error) {
        return rejectWithValue(error.message);
      }
      return rejectWithValue('An unknown error occurred');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedules',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSchedules.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchSchedules.fulfilled, (state, action: PayloadAction<Schedule[]>) => {
        state.status = 'succeeded';
        state.items = action.payload;
        console.log('fetchSchedules: fulfilled', action.payload);
        console.log('Number of schedules fetched:', action.payload.length);
      })
      .addCase(fetchSchedules.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Failed to fetch schedules';
        console.log('fetchSchedules: rejected', state.error);
      })
      .addCase(addSchedule.pending, (state) => {
        state.isAdding = true;
      })
      .addCase(addSchedule.fulfilled, (state, action: PayloadAction<Schedule>) => {
        state.items.push(action.payload);
        state.isAdding = false;
        console.log('addSchedule: fulfilled', action.payload);
        console.log('New total number of schedules:', state.items.length);
      })
      .addCase(addSchedule.rejected, (state) => {
        state.isAdding = false;
      })
      .addCase(updateSchedule.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateSchedule.fulfilled, (state, action: PayloadAction<Schedule>) => {
        const index = state.items.findIndex(item => item.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        state.isUpdating = false;
      })
      .addCase(updateSchedule.rejected, (state) => {
        state.isUpdating = false;
      })
      .addCase(deleteSchedule.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteSchedule.fulfilled, (state, action: PayloadAction<string>) => {
        state.items = state.items.filter(item => item.id !== action.payload);
        state.isDeleting = false;
      })
      .addCase(deleteSchedule.rejected, (state) => {
        state.isDeleting = false;
      });
  },
});

export default scheduleSlice.reducer;