import { Route, Routes } from 'react-router-dom';
import LandingLayout from '../layouts/LandingPageLayout';
import DashboardLayout from '@/layouts/DashboardLayout';
import EditorLayout from '../layouts/EditorLayout';
import LandingPage from '../pages/landing/LandingPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import BundlesPage from '@/pages/dashboard/BundlesPage';
import EditorPage from '../pages/editor/EditorPage';
import NotFound from '@/components/NotFound';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Landing layout wraps landing pages */}
      <Route element={<LandingLayout />}>
        <Route element={<LandingPage />} path="/" />
      </Route>
      {/* Editor layout wraps editor pages */}
      <Route element={<EditorLayout />}>
        <Route element={<EditorPage />} path="/editor" />
        {/* later you can add more routes like /editor/:id */}
      </Route>
      {/* Dashboard pages */}
      <Route element={<DashboardLayout />}>
        <Route element={<DashboardPage />} path="/dashboard" />
        <Route element={<BundlesPage />} path="/dashboard/bundles" />
      </Route>
      <Route>
        <Route element={<NotFound />} path="*" />
      </Route>
    </Routes>
  );
}
