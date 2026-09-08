// src/store/notificationSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error';
  isRead: boolean;
  createdAt: string;
}

interface NotificationState {
  notifications: Notification[];
}

const initialState: NotificationState = {
  notifications: [],
};

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<Notification, 'id' | 'isRead' | 'createdAt'>>) => {
      state.notifications.push({
        ...action.payload,
        id: Date.now().toString(),
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    },
    markNotificationAsRead: (state, action: PayloadAction<string>) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification) {
        notification.isRead = true;
      }
    },
    clearAllNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const { addNotification, markNotificationAsRead, clearAllNotifications } = notificationSlice.actions;

export default notificationSlice.reducer;