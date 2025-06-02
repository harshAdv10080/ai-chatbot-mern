import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoadingSpinner from './components/common/LoadingSpinner';
import Footer from './components/common/Footer';

// Lazy load components for better performance
const Login = React.lazy(() => import('./components/Auth/Login'));
const Register = React.lazy(() => import('./components/Auth/Register'));
const ResetPassword = React.lazy(() => import('./components/Auth/ResetPassword'));
const ChatInterface = React.lazy(() => import('./components/Chat/ChatInterface'));
const Dashboard = React.lazy(() => import('./components/Dashboard/Dashboard'));
const AnimationShowcase = React.lazy(() => import('./components/demo/AnimationShowcase'));

// Protected Route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route component (redirect if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return !isAuthenticated ? children : <Navigate to="/chat" replace />;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col">
      <div className="flex-1">
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
          {/* Public routes */}
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <Register />
              </PublicRoute>
            }
          />
          <Route
            path="/reset-password"
            element={
              <PublicRoute>
                <ResetPassword />
              </PublicRoute>
            }
          />

          {/* Protected routes */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat/:conversationId"
            element={
              <ProtectedRoute>
                <ChatInterface />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Animation Showcase - Public route for demo */}
          <Route
            path="/animations"
            element={<AnimationShowcase />}
          />

          {/* Default redirect */}
          <Route path="/" element={<Navigate to="/chat" replace />} />

          {/* 404 page */}
          <Route
            path="*"
            element={
              <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                    404
                  </h1>
                  <p className="text-gray-600 dark:text-gray-400 mb-8">
                    Page not found
                  </p>
                  <button
                    onClick={() => window.history.back()}
                    className="btn-primary"
                  >
                    Go Back
                  </button>
                </div>
              </div>
            }
          />
          </Routes>
        </Suspense>
      </div>
      <Footer />
    </div>
  );
}

export default App;
