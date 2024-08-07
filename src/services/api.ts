// src/services/api.ts

import axios, { AxiosResponse, AxiosError } from 'axios';
import { Schedule, Session, InstructorApplication, ApiResponse as ApiResponseType } from '../types';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    page?: number;
    pageSize?: number;
    totalCount?: number;
  };
}

const handleApiError = (error: unknown, operation: string) => {
  console.error(`Error in ${operation}:`, error);
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiResponseType<any>>;
    console.error('Axios error details:', axiosError.response?.data);
    console.error('Axios error status:', axiosError.response?.status);
    console.error('Axios error headers:', axiosError.response?.headers);
    throw new Error(axiosError.response?.data?.error?.message || `Failed to ${operation}`);
  }
  throw error;
};

export const getSchedules = async (): Promise<Schedule[]> => {
  try {
    const response = await api.get<Schedule[]>('/schedules');
    console.log('API response for getSchedules:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetch schedules');
  }
};

export const createSchedule = async (schedule: Omit<Schedule, 'id' | 'createdBy'>): Promise<Schedule> => {
  try {
    console.log('Creating schedule:', schedule);
    const response: AxiosResponse<ApiResponse<Schedule>> = await api.post('/schedules', schedule);
    console.log('API response for createSchedule:', response.data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to create schedule');
  } catch (error) {
    return handleApiError(error, 'create schedule');
  }
};

export const updateSchedule = async (id: string, schedule: Partial<Schedule>): Promise<Schedule> => {
  try {
    console.log(`Updating schedule with id ${id}:`, schedule);
    const response: AxiosResponse<ApiResponse<Schedule>> = await api.put(`/schedules/${id}`, schedule);
    console.log('API response for updateSchedule:', response.data);
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Failed to update schedule');
  } catch (error) {
    return handleApiError(error, 'update schedule');
  }
};

export const deleteSchedule = async (id: string): Promise<void> => {
  try {
    console.log(`Deleting schedule with id ${id}`);
    const response: AxiosResponse<ApiResponse<void>> = await api.delete(`/schedules/${id}`);
    console.log('API response for deleteSchedule:', response.data);
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Failed to delete schedule');
    }
  } catch (error) {
    return handleApiError(error, 'delete schedule');
  }
};

export const getSessions = async (
  scheduleId: string,
  page = 1,
  pageSize = 10): Promise<ApiResponse<Session[]>> => {
  try {
    const response: AxiosResponse<ApiResponse<Session[]>> = await api.get(`/schedules/${scheduleId}/sessions`, {
      params: { page, pageSize },
    });
    console.log('API response for getSessions:', response.data);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetch sessions');
  }
};

export const createSession = async (session: Omit<Session, 'id'>): Promise<Session> => {
  const response = await api.post<Session>(`/schedules/${session.scheduleId}/sessions`, session);
  return response.data;
};

export const updateSession = async (session: Session): Promise<Session> => {
  const response = await api.put<Session>(`/schedules/${session.scheduleId}/sessions/${session.id}`, session);
  return response.data;
};

export const deleteSession = async (scheduleId: string, sessionId: string): Promise<void> => {
  await api.delete(`/schedules/${scheduleId}/sessions/${sessionId}`);
};

export const getAvailableSessions = async (): Promise<ApiResponseType<Session[]>> => {
  try {
    const response: AxiosResponse<ApiResponseType<Session[]>> = await api.get('/sessions/available');
    return response.data;
  } catch (error) {
    return handleApiError(error, 'fetch available sessions');
  }
};

export const applyForSession = async (sessionId: string): Promise<ApiResponseType<InstructorApplication>> => {
  try {
    const response: AxiosResponse<ApiResponseType<InstructorApplication>> = await api.post(`/sessions/${sessionId}/apply`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'apply for session');
  }
};

export const cancelApplication = async (applicationId: string): Promise<ApiResponseType<void>> => {
  try {
    const response: AxiosResponse<ApiResponseType<void>> = await api.delete(`/applications/${applicationId}`);
    return response.data;
  } catch (error) {
    return handleApiError(error, 'cancel application');
  }
};

export default api;