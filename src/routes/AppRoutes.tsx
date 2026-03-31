import { lazy, Suspense } from 'react';
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
import ForgotPasswordPage from '@/pages/auth/ForgotPasswordPage';
import ProtectedRoute, { PublicRoute } from './ProtectedRoutes';
import useAuthInit from '@/features/auth/hooks/useAuthInit';
import ResetPasswordPage from '@/pages/auth/ResetPasswordPage';

const CoverPageEditor = lazy(() =>
  import('@/features/cover-page/components/editor/CoverPageEditor').then(
    module => ({
      default: module.CoverPageEditor,
    })
  )
);

export default function AppRoutes() {
  useAuthInit();
  return (
    <Routes>
      {/* Public routes - Landing page */}
      <Route element={<PublicRoute />}>
        <Route element={<LandingLayout />}>
          <Route index element={<LandingPage />} path="/" />
        </Route>
      </Route>

      {/* Auth routes - Redirect to dashboard if already logged in */}
      <Route path="/login" element={<SignInPage />} />
      <Route path="/register" element={<SignUpPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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

        <Route
          element={
            <Suspense
              fallback={
                <div className="flex h-full items-center justify-center text-gray-500">
                  Loading cover page editor...
                </div>
              }
            >
              <CoverPageEditor />
            </Suspense>
          }
          path="/cover-page-editor/:id"
        />
      </Route>

      {/* 404 Not Found */}
      <Route element={<NotFound />} path="*" />
    </Routes>
  );
}
