// src/services/authService.ts

import axios from 'axios';
import { User } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
const USER_KEY = 'user';
const TOKEN_KEY = 'token';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const clearStoredAuth = () => {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
};

const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    return typeof payload.exp === 'number' && payload.exp * 1000 <= Date.now();
  } catch { return true; }
};

const isUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') return false;
  const user = value as User;
  return Number.isInteger(user.id) && typeof user.username === 'string' && typeof user.email === 'string' &&
    (user.role === 'admin' || user.role === 'instructor');
};

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    try {
      const response = await axios.post<AuthResponse>(`${API_BASE_URL}/auth/login`, credentials);
      if (!isUser(response.data.user) || typeof response.data.token !== 'string') throw new Error('로그인 응답 형식이 올바르지 않습니다.');
      clearStoredAuth();
      localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
      localStorage.setItem(TOKEN_KEY, response.data.token);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) throw new Error('아이디 또는 비밀번호를 확인해 주세요.');
      throw error;
    }
  },

  logout: async (): Promise<void> => {
    clearStoredAuth();
  },

  getCurrentUser: (): User | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    if (!token || !userStr || isTokenExpired(token)) { clearStoredAuth(); return null; }
    try {
      const user: unknown = JSON.parse(userStr);
      if (isUser(user)) return user;
    } catch { /* corrupted browser data is treated as signed out */ }
    clearStoredAuth();
    return null;
  },

  getAuthToken: (): string | null => {
    const token = localStorage.getItem(TOKEN_KEY);
    return token && !isTokenExpired(token) ? token : null;
  },

  isAuthenticated: (): boolean => {
    return !!authService.getCurrentUser();
  },
};

export default authService;
