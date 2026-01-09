import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/AdminDashboard';
import ExamManagerDashboard from './pages/ExamManagerDashboard';
import QuestionManagerDashboard from './pages/QuestionManagerDashboard';
import ResultManagerDashboard from './pages/ResultManagerDashboard';
import StudentDashboard from './pages/StudentDashboard';

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={['System Admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/exam-manager"
          element={
            <ProtectedRoute roles={['Exam Manager']}>
              <ExamManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/question-manager"
          element={
            <ProtectedRoute roles={['Question Manager']}>
              <QuestionManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/result-manager"
          element={
            <ProtectedRoute roles={['Result Manager']}>
              <ResultManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/student"
          element={
            <ProtectedRoute roles={['Student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

export default App;
