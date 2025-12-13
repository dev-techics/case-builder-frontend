import { Route, Routes } from 'react-router-dom';
import EditorLayout from '../layouts/EditorLayout';
import LandingLayout from '../layouts/LandingPageLayout';
import EditorPage from '../pages/Editor/EditorPage';
import LandingPage from '../pages/Landing/LandingPage';

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
    </Routes>
  );
}
