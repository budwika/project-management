import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/common/ProtectedRoute';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Projects from './components/projects/Projects';
import Tasks from './components/tasks/Tasks';
import Team from './components/team/Team';
import ChangeRequests from './components/change-requests/ChangeRequests';
import './App.css';

const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  return (
    <div className="App">
      {user && <Navbar />}
      <main className={user ? 'max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8' : ''}>
        {children}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/projects"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Projects />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route
            path="/tasks"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Tasks />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route
            path="/team"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <Team />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route
            path="/change-requests"
            element={
              <AppLayout>
                <ProtectedRoute>
                  <ChangeRequests />
                </ProtectedRoute>
              </AppLayout>
            }
          />
          <Route path="/" element={<Navigate to="/projects" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
