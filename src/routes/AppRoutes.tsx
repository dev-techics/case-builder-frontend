import { Route, Routes } from 'react-router-dom';
import LandingLayout from '../layouts/LandingPageLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import EditorLayout from '../layouts/EditorLayout';
import LandingPage from '../pages/landing/LandingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BundlesPage from '@/pages/dashboard/BundlesPage';
import EditorPage from '../pages/editor/EditorPage';
import NotFound from '@/components/NotFound';
import SignInPage from '@/pages/auth/SignInPage';
import SignUpPage from '@/pages/auth/SignUpPage';
import ProtectedRoute from './ProtectedRoutes';
import useAuthInit from '@/features/auth/hooks/useAuthInit';

export default function AppRoutes() {
  useAuthInit();
  return (
    <Routes>
      {/* Public routes - Landing page */}
      <Route element={<LandingLayout />}>
        <Route element={<LandingPage />} path="/" />
      </Route>

      {/* Auth routes - Redirect to dashboard if already logged in */}
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />

      <Route element={<ProtectedRoute />}>
        {/* Protected routes - Editor layout */}
        <Route element={<EditorLayout />}>
          <Route element={<EditorPage />} path="/dashboard/editor/:bundleId?" />
        </Route>

        {/* Protected routes - Dashboard layout */}
        <Route element={<DashboardLayout />}>
          <Route element={<DashboardPage />} path="/dashboard" />
          <Route element={<BundlesPage />} path="/dashboard/bundles" />
        </Route>
      </Route>

      {/* 404 Not Found */}
      <Route element={<NotFound />} path="*" />
    </Routes>
  );
}
