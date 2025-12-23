import { Route, Routes, Navigate } from 'react-router-dom';
import { useAppSelector } from '@/app/hooks';
import { selectIsAuthenticated } from '@/features/auth/redux/authSlice';
import ProtectedRoute from '@/features/auth/components/ProtectedRoute';
import AuthLayout from '@/features/auth/components/AuthLayout';
import LoginForm from '@/features/auth/components/LoginForm';
import RegisterForm from '@/features/auth/components/RegisterForm';
import LandingLayout from '../layouts/LandingPageLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import EditorLayout from '../layouts/EditorLayout';
import LandingPage from '../pages/landing/LandingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BundlesPage from '@/pages/dashboard/BundlesPage';
import EditorPage from '../pages/editor/EditorPage';
import NotFound from '@/components/NotFound';

export default function AppRoutes() {
  const isAuthenticated = useAppSelector(selectIsAuthenticated);

  return (
    <Routes>
      {/* Public routes - Landing page */}
      <Route element={<LandingLayout />}>
        <Route element={<LandingPage />} path="/" />
      </Route>

      {/* Auth routes - Redirect to dashboard if already logged in */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <LoginForm />
            </AuthLayout>
          )
        }
      />
      <Route
        path="/register"
        element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AuthLayout>
              <RegisterForm />
            </AuthLayout>
          )
        }
      />

      {/* Protected routes - Editor layout */}
      <Route
        element={
          <ProtectedRoute>
            <EditorLayout />
          </ProtectedRoute>
        }
      >
        <Route element={<EditorPage />} path="/dashboard/editor/:id?" />
      </Route>

      {/* Protected routes - Dashboard layout */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<BundlesPage />} path="/dashboard/bundles" />
      </Route>

      {/* 404 Not Found */}
      <Route element={<NotFound />} path="*" />
    </Routes>
  );
}
