export interface User {
    id: string;
    username: string;
    role: 'admin' | 'instructor';
  }
  
  export interface Schedule {
    id: string;
    date: string;
    institutionId: string;
    region: string;
    capacity: number;
    trainingType: string;
    status: 'open' | 'closed' | 'adjusted';
    createdBy: string;
  }
  
  export interface Session {
    id: string;
    scheduleId: string;
    testName: string;
    grade: number | null;
    classCount: number;
    studentCount: number;
    startTime: string;
    endTime: string;
    region: string;
    trainingType: string;
    compensation: number;
    paymentMethod: 'company' | 'school' | 'branch';
    assignedInstructorId: string | null;
  }
  
  export interface InstructorApplication {
    id: string;
    sessionId: string;
    instructorId: string;
    status: 'pending' | 'approved' | 'rejected';
    session: Session;
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
      code: string;
      message: string;
    };
  }