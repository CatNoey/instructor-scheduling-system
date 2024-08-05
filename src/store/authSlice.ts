// src/store/authSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import authService, { LoginCredentials } from '../services/authService';
import { User } from '../types';
import { UserRole, Permission, getPermissions } from '../utils/permissions';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  permissions: Permission | null;
}

const initialState: AuthState = {
  user: authService.getCurrentUser(),
  isAuthenticated: authService.isAuthenticated(),
  loading: false,
  error: null,
  permissions: authService.getCurrentUser() 
    ? getPermissions(authService.getCurrentUser()!.role)
    : null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async () => {
  await authService.logout();
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.permissions = getPermissions(action.payload.role);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.permissions = null;
      });
  },
});

export const { clearError } = authSlice.actions;

export default authSlice.reducer;