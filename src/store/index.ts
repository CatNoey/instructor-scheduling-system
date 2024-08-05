// src/store/index.ts

import { configureStore } from '@reduxjs/toolkit';
import scheduleReducer from './scheduleSlice';
import sessionReducer from './sessionSlice';
import authReducer from './authSlice';

const store = configureStore({
  reducer: {
    schedules: scheduleReducer,
    sessions: sessionReducer,
    auth: authReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;