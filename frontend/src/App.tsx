import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import CreateFounderPage from './pages/CreateFounderPage';
import FounderDashboard from './pages/FounderDashboard';
import DirectorDashboard from './pages/DirectorDashboard';
import TeacherDashboard from './pages/TeacherDashboard';
import StudentsPage from './pages/StudentsPage';
import TeachersPage from './pages/TeachersPage';
import TuitionPage from './pages/TuitionPage';
import SalaryPage from './pages/SalaryPage';
import PassagePage from './pages/PassagePage';
import ExpensesPage from './pages/ExpensesPage';
import StatisticsPage from './pages/StatisticsPage';
import ActivityLogPage from './pages/ActivityLogPage';
import './App.css';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
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
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
