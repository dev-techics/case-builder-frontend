import { Navigate, Outlet } from 'react-router-dom';
import { selectIsAuthenticated } from '@/features/auth/redux/authSlice';
import { useAppSelector } from '@/app/hooks';
import { isAuthenticated } from '@/features/auth/utils';

const ProtectedRoute = () => {
  const isUserAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasToken = isAuthenticated();

  if (!isUserAuthenticated && !hasToken) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export const PublicRoute = () => {
  const isUserAuthenticated = useAppSelector(selectIsAuthenticated);
  const hasToken = isAuthenticated();

  if (isUserAuthenticated || hasToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
