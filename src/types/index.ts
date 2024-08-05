// src/types/index.ts

import { UserRole } from '../utils/permissions';

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'instructor'; // Adjust these roles as needed for your application
}
  
export interface Instructor {
  id: string;
  userId: string;
  name: string;
  rank: 'team_leader' | 'regular' | 'new';
  phoneNumber: string;
  region: string;
  availableDays: string[];
  prohibitedAdmins: string[];
  notes: string;
}
  
export interface Schedule {
  id: string;
  date: string; // ISO string
  institutionName: string;
  region: string;
  capacity: number;
  trainingType: 'class' | 'teacher' | 'all_staff' | 'remote' | 'other';
  status: 'open' | 'closed' | 'adjusted';
  createdBy: string;
}

export interface Session {
  id: string;
  scheduleId: string;
  startTime: string;
  endTime: string;
  instructor: string;
  notes?: string;
  testName?: string;
  grade?: string;
  classCount?: number;
  studentCount?: number;
  compensation?: number;
}

export interface Institution {
  id: string;
  name: string;
  type: 'elementary' | 'middle' | 'high' | 'other';
  region: string;
}

export interface Payroll {
  id: string;
  instructorId: string;
  month: number;
  year: number;
  totalCompensation: number;
  status: 'pending' | 'completed';
}

export interface ApiResponse<T> {
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