import { Navigate, Outlet } from 'react-router-dom';
import { authStorage } from '@/lib/api-client';

export function ProtectedRoute() {
  const role = authStorage.getRole();
  const token = authStorage.getAccess();
  if (role !== 'admin' || !token) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
