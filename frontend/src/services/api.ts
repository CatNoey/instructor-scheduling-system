import axios, { AxiosError } from 'axios';
import {
  ApiEnvelope, InstructorApplication, Schedule, ScheduleInput, Session, SessionInput, SessionUpdateInput,
} from '../types';
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
export const UNAUTHORIZED_EVENT = 'instructor-scheduling:unauthorized';
const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });

api.interceptors.request.use((config) => {
  const token = authService.getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    return Promise.reject(error);
  },
);

const messageFor = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as Partial<ApiEnvelope<unknown>> | undefined;
    if (body && body.success === false && body.error) return body.error.message;
    if (body && typeof (body as { message?: unknown }).message === 'string') return (body as { message: string }).message;
  }
  return error instanceof Error ? error.message : fallback;
};
const unwrap = <T>(envelope: ApiEnvelope<T>, fallback: string): T => {
  if (envelope.success) return envelope.data;
  throw new Error(envelope.error.message || fallback);
};
const schedulePayload = (schedule: ScheduleInput) => ({
  date: schedule.date, institutionName: schedule.institutionName, region: schedule.region,
  capacity: schedule.capacity, trainingType: schedule.trainingType, status: schedule.status,
});
const sessionPayload = (session: SessionInput | SessionUpdateInput) => ({
  startTime: session.startTime, endTime: session.endTime, instructor: session.instructor,
  notes: session.notes ?? null, trainingType: session.trainingType,
});

export const getSchedules = async (): Promise<Schedule[]> => {
  try { return unwrap((await api.get<ApiEnvelope<Schedule[]>>('/schedules')).data, 'Failed to fetch schedules'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to fetch schedules')); }
};
export const createSchedule = async (schedule: ScheduleInput): Promise<Schedule> => {
  try { return unwrap((await api.post<ApiEnvelope<Schedule>>('/schedules', schedulePayload(schedule))).data, 'Failed to create schedule'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to create schedule')); }
};
export const updateSchedule = async (id: number, schedule: ScheduleInput): Promise<Schedule> => {
  try { return unwrap((await api.put<ApiEnvelope<Schedule>>(`/schedules/${id}`, schedulePayload(schedule))).data, 'Failed to update schedule'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to update schedule')); }
};
export const deleteSchedule = async (id: number): Promise<void> => {
  try { unwrap((await api.delete<ApiEnvelope<null>>(`/schedules/${id}`)).data, 'Failed to delete schedule'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to delete schedule')); }
};
export const getSessions = async (scheduleId: number): Promise<Session[]> => {
  try { return unwrap((await api.get<ApiEnvelope<Session[]>>(`/schedules/${scheduleId}/sessions`)).data, 'Failed to fetch sessions'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to fetch sessions')); }
};
export const createSession = async (session: SessionInput): Promise<Session> => {
  try { return unwrap((await api.post<ApiEnvelope<Session>>(`/schedules/${session.scheduleId}/sessions`, sessionPayload(session))).data, 'Failed to create session'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to create session')); }
};
export const updateSession = async (session: Session): Promise<Session> => {
  try { return unwrap((await api.put<ApiEnvelope<Session>>(`/schedules/${session.scheduleId}/sessions/${session.id}`, sessionPayload(session))).data, 'Failed to update session'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to update session')); }
};
export const deleteSession = async (scheduleId: number, sessionId: number): Promise<void> => {
  try { unwrap((await api.delete<ApiEnvelope<null>>(`/schedules/${scheduleId}/sessions/${sessionId}`)).data, 'Failed to delete session'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to delete session')); }
};
export const getAvailableSessions = async (): Promise<Session[]> => {
  try { return unwrap((await api.get<ApiEnvelope<Session[]>>('/sessions/available')).data, 'Failed to fetch available sessions'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to fetch available sessions')); }
};
export const applyForSession = async (sessionId: number): Promise<InstructorApplication> => {
  try { return unwrap((await api.post<ApiEnvelope<InstructorApplication>>(`/sessions/${sessionId}/apply`)).data, 'Failed to apply for session'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to apply for session')); }
};
export const cancelApplication = async (applicationId: number): Promise<void> => {
  try { unwrap((await api.delete<ApiEnvelope<null>>(`/applications/${applicationId}`)).data, 'Failed to cancel application'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to cancel application')); }
};
export const getInstructorApplications = async (): Promise<InstructorApplication[]> => {
  try { return unwrap((await api.get<ApiEnvelope<InstructorApplication[]>>('/applications')).data, 'Failed to fetch applications'); }
  catch (error) { throw new Error(messageFor(error, 'Failed to fetch applications')); }
};
export default api;
