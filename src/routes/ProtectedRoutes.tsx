import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth/redux/authSlice';
import { authApi } from '@/features/auth/api/authApi';
import { useAppSelector } from '@/app/hooks';

const ProtectedRoute = () => {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasToken = authApi.isAuthenticated();

  if (!isAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
