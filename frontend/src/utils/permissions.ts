// src/utils/permissions.ts

import { UserRole } from '../types';

export type { UserRole } from '../types';

export interface Permission {
  viewSchedules: boolean;
  editSchedules: boolean;
  deleteSchedules: boolean;
  viewSessions: boolean;
  editSessions: boolean;
  deleteSessions: boolean;
  applyToSessions: boolean;
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
  },
  instructor: {
    viewSchedules: true,
    editSchedules: false,
    deleteSchedules: false,
    viewSessions: true,
    editSessions: false,
    deleteSessions: false,
    applyToSessions: true,
  },
};

export const getPermissions = (role: UserRole): Permission => permissions[role];
