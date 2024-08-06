// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import scheduleReducer from './scheduleSlice';
import authReducer from './authSlice';
import sessionReducer from './sessionSlice';
import notificationReducer from './notificationSlice';

export const store = configureStore({
  reducer: {
    schedules: scheduleReducer,
    auth: authReducer,
    sessions: sessionReducer,
    notifications: notificationReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;