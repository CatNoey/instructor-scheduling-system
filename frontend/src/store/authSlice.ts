// src/store/authSlice.ts

import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import authService, { LoginCredentials } from '../services/authService';
import { User } from '../types';
import { Permission, getPermissions } from '../utils/permissions';

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
    } catch (error: unknown) {
      return rejectWithValue(error instanceof Error ? error.message : '로그인하지 못했습니다.');
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
    expireSession: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.permissions = null;
      state.loading = false;
      state.error = '로그인 시간이 만료되었습니다. 다시 로그인해 주세요.';
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
        state.user = action.payload;
        state.isAuthenticated = true;
        state.permissions = getPermissions(action.payload.role);
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.isAuthenticated = false;
        state.permissions = null;
      });
  },
});

export const { clearError, expireSession } = authSlice.actions;

export default authSlice.reducer;
