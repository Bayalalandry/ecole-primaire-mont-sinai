import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import LoginPage from './pages/LoginPage';
import './App.css';

// Lazy load all pages except LoginPage (entry point)
const RegisterPage = lazy(() => import('./pages/RegisterPage'));
const CreateFounderPage = lazy(() => import('./pages/CreateFounderPage'));
const FounderDashboard = lazy(() => import('./pages/FounderDashboard'));
const DirectorDashboard = lazy(() => import('./pages/DirectorDashboard'));
const TeacherDashboard = lazy(() => import('./pages/TeacherDashboard'));
const StudentsPage = lazy(() => import('./pages/StudentsPage'));
const TeachersPage = lazy(() => import('./pages/TeachersPage'));
const TuitionPage = lazy(() => import('./pages/TuitionPage'));
const SalaryPage = lazy(() => import('./pages/SalaryPage'));
const PassagePage = lazy(() => import('./pages/PassagePage'));
const ExpensesPage = lazy(() => import('./pages/ExpensesPage'));
const StatisticsPage = lazy(() => import('./pages/StatisticsPage'));
const ActivityLogPage = lazy(() => import('./pages/ActivityLogPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Loading component for Suspense
function LoadingFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-blue-600 text-lg">Chargement...</div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<LoginPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/create-founder" element={<CreateFounderPage />} />
            <Route path="/dashboard/founder" element={<FounderDashboard />} />
            <Route path="/dashboard/director" element={<DirectorDashboard />} />
            <Route path="/dashboard/teacher" element={<TeacherDashboard />} />
            <Route path="/students" element={<StudentsPage />} />
            <Route path="/teachers" element={<TeachersPage />} />
            <Route path="/tuition" element={<TuitionPage />} />
            <Route path="/salaries" element={<SalaryPage />} />
            <Route path="/passage" element={<PassagePage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/statistics" element={<StatisticsPage />} />
            <Route path="/activity-log" element={<ActivityLogPage />} />
            <Route path="/profile/:type/:id" element={<ProfilePage />} />
            <Route path="*" element={<LoginPage />} />
          </Routes>
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
