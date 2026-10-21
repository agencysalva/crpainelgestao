import { useAuth } from '../context/AuthContext';

export function usePermissions() {
  const { user } = useAuth();

  const isAdmin = user?.role === 'admin' || user?.role === 'manager';
  const isEmployee = user?.role === 'employee';
  const isTechnician = user?.role === 'technician' || user?.role === 'employee';
  const canDelete = isAdmin;
  const canDeleteWorkOrder = isAdmin;
  const canEditFinancials = isAdmin;
  const canResetSystem = user?.role === 'admin';
  const canManageUsers = isAdmin;

  return {
    user,
    role: user?.role,
    isAdmin,
    isEmployee,
    isTechnician,
    canDelete,
    canDeleteWorkOrder,
    canEditFinancials,
    canResetSystem,
    canManageUsers,
  };
}
