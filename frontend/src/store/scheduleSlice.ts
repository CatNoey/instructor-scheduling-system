import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Schedule, ScheduleInput } from '../types';
import { createSchedule as apiCreateSchedule, getSchedules as apiGetSchedules, updateSchedule as apiUpdateSchedule, deleteSchedule as apiDeleteSchedule } from '../services/api';

interface ScheduleState {
  items: Schedule[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  isAdding: boolean;
  isUpdating: boolean;
  isDeleting: boolean;
}
const initialState: ScheduleState = { items: [], status: 'idle', error: null, isAdding: false, isUpdating: false, isDeleting: false };
const errorMessage = (error: unknown) => error instanceof Error ? error.message : '처리 중 알 수 없는 오류가 발생했습니다.';

export const fetchSchedules = createAsyncThunk<Schedule[], void, { rejectValue: string }>(
  'schedules/fetchSchedules', async (_, { rejectWithValue }) => {
    try { return await apiGetSchedules(); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const addSchedule = createAsyncThunk<Schedule, ScheduleInput, { rejectValue: string }>(
  'schedules/addSchedule', async (schedule, { rejectWithValue }) => {
    try { return await apiCreateSchedule(schedule); } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const updateSchedule = createAsyncThunk<Schedule, Schedule, { rejectValue: string }>(
  'schedules/updateSchedule', async (schedule, { rejectWithValue }) => {
    try {
      const { id, ...input } = schedule;
      return await apiUpdateSchedule(id, input);
    } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);
export const deleteSchedule = createAsyncThunk<number, number, { rejectValue: string }>(
  'schedules/deleteSchedule', async (scheduleId, { rejectWithValue }) => {
    try { await apiDeleteSchedule(scheduleId); return scheduleId; } catch (error) { return rejectWithValue(errorMessage(error)); }
  },
);

const scheduleSlice = createSlice({
  name: 'schedules', initialState,
  reducers: { resetSchedules: () => initialState, clearScheduleError: (state) => { state.error = null; } },
  extraReducers: (builder) => builder
    .addCase(fetchSchedules.pending, (state) => { state.status = 'loading'; state.error = null; })
    .addCase(fetchSchedules.fulfilled, (state, action: PayloadAction<Schedule[]>) => { state.status = 'succeeded'; state.items = action.payload; })
    .addCase(fetchSchedules.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload || '일정 목록을 불러오지 못했습니다.'; })
    .addCase(addSchedule.pending, (state) => { state.isAdding = true; state.error = null; })
    .addCase(addSchedule.fulfilled, (state, action) => { state.items.push(action.payload); state.isAdding = false; })
    .addCase(addSchedule.rejected, (state, action) => { state.isAdding = false; state.error = action.payload || '일정을 등록하지 못했습니다.'; })
    .addCase(updateSchedule.pending, (state) => { state.isUpdating = true; state.error = null; })
    .addCase(updateSchedule.fulfilled, (state, action) => { const index = state.items.findIndex((item) => item.id === action.payload.id); if (index !== -1) state.items[index] = action.payload; state.isUpdating = false; })
    .addCase(updateSchedule.rejected, (state, action) => { state.isUpdating = false; state.error = action.payload || '일정을 수정하지 못했습니다.'; })
    .addCase(deleteSchedule.pending, (state) => { state.isDeleting = true; state.error = null; })
    .addCase(deleteSchedule.fulfilled, (state, action) => { state.items = state.items.filter((item) => item.id !== action.payload); state.isDeleting = false; })
    .addCase(deleteSchedule.rejected, (state, action) => { state.isDeleting = false; state.error = action.payload || '일정을 삭제하지 못했습니다.'; }),
});
export const { resetSchedules, clearScheduleError } = scheduleSlice.actions;
export default scheduleSlice.reducer;
