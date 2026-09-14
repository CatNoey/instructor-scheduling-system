export type UserRole = 'admin' | 'instructor';
export type TrainingType = 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
export type ScheduleStatus = 'open' | 'closed' | 'adjusted';

/** IDs are numeric throughout the API, including the JWT userId claim. */
export interface User { id: number; username: string; email: string; role: UserRole; }

export interface Schedule {
  id: number;
  /** Business date, never an ISO timestamp. */
  date: string;
  institutionName: string;
  region: string;
  capacity: number;
  trainingType: TrainingType;
  status: ScheduleStatus;
}
export type ScheduleInput = Omit<Schedule, 'id'>;

export interface Session {
  id: number;
  scheduleId: number;
  /** UTC ISO timestamp returned by the API. */
  startTime: string;
  /** UTC ISO timestamp returned by the API. */
  endTime: string;
  /** Free-text contact or session label set by an administrator. */
  instructor: string;
  notes?: string | null;
  trainingType: TrainingType;
  /** Included for instructor-facing session lists. */
  schedule?: Pick<Schedule, 'id' | 'date' | 'institutionName' | 'region' | 'status'>;
}
export type SessionInput = Omit<Session, 'id'>;
export type SessionUpdateInput = Omit<Session, 'id' | 'scheduleId'>;

export interface InstructorApplication {
  id: number;
  sessionId: number;
  instructorId: number;
  status: 'pending' | 'approved' | 'rejected';
  session: Session;
  instructor?: Pick<User, 'id' | 'username' | 'email'>;
  createdAt: string;
}

export interface UserNotification {
  id: number;
  message: string;
  type: 'info' | 'warning' | 'error';
  readAt: string | null;
  createdAt: string;
}

export interface ApiError { code: string; message: string; }
export interface ApiResponse<T> { success: true; data: T; }
export interface ApiFailureResponse { success: false; error: ApiError; }
export type ApiEnvelope<T> = ApiResponse<T> | ApiFailureResponse;
