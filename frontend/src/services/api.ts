import axios, { AxiosError } from 'axios';
import {
  ApiEnvelope, InstructorApplication, Schedule, ScheduleInput, Session, SessionInput, SessionUpdateInput, UserNotification,
} from '../types';
import authService from './authService';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api';
export const UNAUTHORIZED_EVENT = 'instructor-scheduling:unauthorized';
const api = axios.create({ baseURL: API_BASE_URL, withCredentials: true });
const koreanErrorMessage: Record<string, string> = {
  NOT_AUTHENTICATED: '로그인이 필요합니다.',
  INVALID_CREDENTIALS: '아이디 또는 비밀번호를 확인해 주세요.',
  FORBIDDEN: '이 작업을 수행할 권한이 없습니다.',
  VALIDATION_ERROR: '입력 내용을 확인해 주세요.',
  CONFLICT: '현재 상태에서는 요청을 처리할 수 없습니다.',
  CAPACITY_REACHED: '이 일정의 필요 배정 인원이 모두 채워졌습니다.',
  TIME_CONFLICT: '이 강사는 겹치는 시간에 이미 배정되어 있습니다.',
  NOT_FOUND: '요청한 정보를 찾을 수 없습니다.',
  INTERNAL_ERROR: '일시적인 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.',
};

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
    if (body && body.success === false && body.error) return koreanErrorMessage[body.error.code] || body.error.message;
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
  try { return unwrap((await api.get<ApiEnvelope<Schedule[]>>('/schedules')).data, '일정을 불러오지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '일정을 불러오지 못했습니다.')); }
};
export const createSchedule = async (schedule: ScheduleInput): Promise<Schedule> => {
  try { return unwrap((await api.post<ApiEnvelope<Schedule>>('/schedules', schedulePayload(schedule))).data, '일정을 등록하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '일정을 등록하지 못했습니다.')); }
};
export const updateSchedule = async (id: number, schedule: ScheduleInput): Promise<Schedule> => {
  try { return unwrap((await api.put<ApiEnvelope<Schedule>>(`/schedules/${id}`, schedulePayload(schedule))).data, '일정을 수정하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '일정을 수정하지 못했습니다.')); }
};
export const deleteSchedule = async (id: number): Promise<void> => {
  try { unwrap((await api.delete<ApiEnvelope<null>>(`/schedules/${id}`)).data, '일정을 삭제하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '일정을 삭제하지 못했습니다.')); }
};
export const getSessions = async (scheduleId: number): Promise<Session[]> => {
  try { return unwrap((await api.get<ApiEnvelope<Session[]>>(`/schedules/${scheduleId}/sessions`)).data, '세션을 불러오지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '세션을 불러오지 못했습니다.')); }
};
export const createSession = async (session: SessionInput): Promise<Session> => {
  try { return unwrap((await api.post<ApiEnvelope<Session>>(`/schedules/${session.scheduleId}/sessions`, sessionPayload(session))).data, '세션을 등록하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '세션을 등록하지 못했습니다.')); }
};
export const updateSession = async (session: Session): Promise<Session> => {
  try { return unwrap((await api.put<ApiEnvelope<Session>>(`/schedules/${session.scheduleId}/sessions/${session.id}`, sessionPayload(session))).data, '세션을 수정하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '세션을 수정하지 못했습니다.')); }
};
export const deleteSession = async (scheduleId: number, sessionId: number): Promise<void> => {
  try { unwrap((await api.delete<ApiEnvelope<null>>(`/schedules/${scheduleId}/sessions/${sessionId}`)).data, '세션을 삭제하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '세션을 삭제하지 못했습니다.')); }
};
export const getAvailableSessions = async (): Promise<Session[]> => {
  try { return unwrap((await api.get<ApiEnvelope<Session[]>>('/sessions/available')).data, '지원 가능한 세션을 불러오지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '지원 가능한 세션을 불러오지 못했습니다.')); }
};
export const applyForSession = async (sessionId: number): Promise<InstructorApplication> => {
  try { return unwrap((await api.post<ApiEnvelope<InstructorApplication>>(`/sessions/${sessionId}/apply`)).data, '지원하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '지원하지 못했습니다.')); }
};
export const cancelApplication = async (applicationId: number): Promise<void> => {
  try { unwrap((await api.delete<ApiEnvelope<null>>(`/applications/${applicationId}`)).data, '지원을 취소하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '지원을 취소하지 못했습니다.')); }
};
export const getInstructorApplications = async (): Promise<InstructorApplication[]> => {
  try { return unwrap((await api.get<ApiEnvelope<InstructorApplication[]>>('/applications')).data, '지원 내역을 불러오지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '지원 내역을 불러오지 못했습니다.')); }
};
export const getScheduleApplications = async (scheduleId: number): Promise<InstructorApplication[]> => {
  try { return unwrap((await api.get<ApiEnvelope<InstructorApplication[]>>(`/schedules/${scheduleId}/applications`)).data, '지원 목록을 불러오지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '지원 목록을 불러오지 못했습니다.')); }
};
export const reviewApplication = async (applicationId: number, status: InstructorApplication['status']): Promise<InstructorApplication> => {
  try { return unwrap((await api.patch<ApiEnvelope<InstructorApplication>>(`/applications/${applicationId}/review`, { status })).data, '지원 상태를 변경하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '지원 상태를 변경하지 못했습니다.')); }
};
export const getNotifications = async (): Promise<UserNotification[]> => {
  try { return unwrap((await api.get<ApiEnvelope<UserNotification[]>>('/notifications')).data, '알림을 불러오지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '알림을 불러오지 못했습니다.')); }
};
export const markNotificationRead = async (notificationId: number): Promise<UserNotification> => {
  try { return unwrap((await api.patch<ApiEnvelope<UserNotification>>(`/notifications/${notificationId}/read`)).data, '알림을 읽음 처리하지 못했습니다.'); }
  catch (error) { throw new Error(messageFor(error, '알림을 읽음 처리하지 못했습니다.')); }
};
export default api;
