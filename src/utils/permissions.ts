import { User, UserRole } from '../types';

export type PermissionKey =
  | 'users:manage'
  | 'financial:view'
  | 'financial:manage'
  | 'records:delete'
  | 'settings:manage'
  | 'backup:manage'
  | 'audit:view'
  | 'reports:view'
  | 'quotes:manage'
  | 'workorders:manage'
  | 'workorders:view_all'
  | 'customers:manage'
  | 'locations:manage'
  | 'export:data'
  | 'technician_mode:use';

const ROLE_PERMISSIONS: Record<UserRole, PermissionKey[]> = {
  admin: [
    'users:manage',
    'financial:view',
    'financial:manage',
    'records:delete',
    'settings:manage',
    'backup:manage',
    'audit:view',
    'reports:view',
    'quotes:manage',
    'workorders:manage',
    'workorders:view_all',
    'customers:manage',
    'locations:manage',
    'export:data',
    'technician_mode:use',
  ],
  manager: [
    'financial:view',
    'financial:manage',
    'audit:view',
    'reports:view',
    'quotes:manage',
    'workorders:manage',
    'workorders:view_all',
    'customers:manage',
    'locations:manage',
    'export:data',
    'technician_mode:use',
  ],
  employee: [
    'quotes:manage',
    'workorders:manage',
    'workorders:view_all',
    'customers:manage',
    'locations:manage',
    'export:data',
  ],
  technician: [
    'technician_mode:use',
    'workorders:manage',
  ],
};

export function hasPermission(
  userOrRole: User | UserRole | null | undefined,
  permission: PermissionKey
): boolean {
  if (!userOrRole) return false;
  const role: UserRole = typeof userOrRole === 'string' ? userOrRole : userOrRole.role;
  if (role === 'admin') return true;
  const userPerms = ROLE_PERMISSIONS[role] || [];
  return userPerms.includes(permission);
}

export function getRoleBadge(role: UserRole): { label: string; colorClass: string } {
  switch (role) {
    case 'admin':
    case 'manager':
      return { label: 'Administrador', colorClass: 'bg-purple-50 text-purple-700 border-purple-200' };
    case 'employee':
    case 'technician':
    default:
      return { label: 'Funcionário', colorClass: 'bg-blue-50 text-blue-700 border-blue-200' };
  }
}
