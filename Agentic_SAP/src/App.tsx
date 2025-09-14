import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { DataProvider } from './contexts/DataContext';
import Dashboard from './components/Dashboard';
import Login from './components/Login';
import Chat from './components/Chat';
import Courses from './components/Courses';
import Goals from './components/Goals';
import Calendar from './components/Calendar';
import Analytics from './components/Analytics';
import ProtectedRoute from './components/ProtectedRoute';
import SkillGapTest from './components/SkillGapTest';
import Skills from './components/Skills';
import Feedback from './pages/Feedback';
import ProofReview from './components/ProofReview';
import { FeedbackProvider } from './contexts/FeedbackContext';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <DataProvider>
          <FeedbackProvider>
            <Router>
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <Chat />
                  </ProtectedRoute>
                } />
                <Route path="/courses" element={
                  <ProtectedRoute>
                    <Courses />
                  </ProtectedRoute>
                } />
                <Route path="/goals" element={
                  <ProtectedRoute>
                    <Goals />
                  </ProtectedRoute>
                } />
                <Route path="/skills" element={
                  <ProtectedRoute>
                    <Skills />
                  </ProtectedRoute>
                } />
                <Route path="/skillgap-test" element={<SkillGapTest />} />
                <Route path="/calendar" element={
                  <ProtectedRoute>
                    <Calendar />
                  </ProtectedRoute>
                } />
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/proof-review" element={
                  <ProtectedRoute>
                    <ProofReview />
                  </ProtectedRoute>
                } />
                <Route path="/feedback" element={<Feedback />} />
              </Routes>
            </div>
          </Router>
        </FeedbackProvider>
      </DataProvider>
    </AuthProvider>
  </ThemeProvider>
  );
}

export default App;
