import { UserRole } from './permissions';

export type Permission = 'read' | 'write' | 'delete';

export function getPermissions(role: UserRole): Permission[] {
  switch (role) {
    case 'admin':
      return ['read', 'write', 'delete'];
    case 'instructor':
      return ['read', 'write'];
    case 'student':
      return ['read'];
    default:
      return [];
  }
}