import { Navigate, Outlet } from 'react-router-dom';
import { authStorage } from '@/lib/api-client';

export function ProtectedRoute() {
  const role = authStorage.getRole();
  if (role !== 'admin') {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
