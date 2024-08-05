// src/utils/permissions.ts

export type UserRole = 'admin' | 'instructor' | 'student' | 'team_leader' | 'regular' | 'new';

export interface Permission {
  viewSchedules: boolean;
  editSchedules: boolean;
  deleteSchedules: boolean;
  viewSessions: boolean;
  editSessions: boolean;
  deleteSessions: boolean;
  applyToSessions: boolean;
  viewTeamLeaderSchedules: boolean;
}

const permissions: Record<UserRole, Permission> = {
  admin: {
    viewSchedules: true,
    editSchedules: true,
    deleteSchedules: true,
    viewSessions: true,
    editSessions: true,
    deleteSessions: true,
    applyToSessions: false,
    viewTeamLeaderSchedules: true,
  },
  instructor: {
    viewSchedules: true,
    editSchedules: false,
    deleteSchedules: false,
    viewSessions: true,
    editSessions: false,
    deleteSessions: false,
    applyToSessions: true,
    viewTeamLeaderSchedules: false,
  },
  student: {
    viewSchedules: true,
    editSchedules: false,
    deleteSchedules: false,
    viewSessions: true,
    editSessions: false,
    deleteSessions: false,
    applyToSessions: true,
    viewTeamLeaderSchedules: false,
  },
  team_leader: {
    viewSchedules: true,
    editSchedules: true,
    deleteSchedules: true,
    viewSessions: true,
    editSessions: true,
    deleteSessions: true,
    applyToSessions: false,
    viewTeamLeaderSchedules: true,
  },
  regular: {
    viewSchedules: true,
    editSchedules: false,
    deleteSchedules: false,
    viewSessions: true,
    editSessions: false,
    deleteSessions: false,
    applyToSessions: true,
    viewTeamLeaderSchedules: false,
  },
  new: {
    viewSchedules: true,
    editSchedules: false,
    deleteSchedules: false,
    viewSessions: true,
    editSessions: false,
    deleteSessions: false,
    applyToSessions: true,
    viewTeamLeaderSchedules: false,
  },
};

export const can = (role: UserRole, action: keyof Permission): boolean => {
  return permissions[role][action];
};

export const getPermissions = (role: UserRole): Permission => permissions[role];