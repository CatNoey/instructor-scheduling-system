// src/services/authService.ts

import axios from 'axios';
import { User } from '../types';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    // This is a mock login function. Replace this with actual API call when ready.
    return new Promise((resolve) => {
      setTimeout(() => {
        const user: User = {
          id: '1',
          username: credentials.username,
          email: `${credentials.username}@example.com`, // Mock email
          role: 'admin', // or 'instructor', depending on your needs
        };
        const token = 'mock-jwt-token';
        // Store user and token in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', token);
        resolve({ user, token });
      }, 1000); // Simulate network delay
    });
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
  },

  getAuthToken: (): string | null => {
    return localStorage.getItem('token');
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('token');
  },
};

export default authService;