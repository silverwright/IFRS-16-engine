import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const { user, userProfile, loading, openLoginModal } = useAuth();
  const location = useLocation();

  // Open login modal if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      openLoginModal(location.pathname);
    }
  }, [loading, user, location.pathname, openLoginModal]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show a message while login modal is displayed
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
          <p className="mt-4 text-slate-600 dark:text-slate-400">Please sign in to continue...</p>
        </div>
      </div>
    );
  }

  // Check role-based access if roles are specified
  if (requiredRoles && requiredRoles.length > 0) {
    if (!userProfile || !requiredRoles.includes(userProfile.role)) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
          <div className="max-w-md mx-4 text-center">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-slate-700">
              <svg
                className="mx-auto h-16 w-16 text-red-500 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-2xl font-bold text-white mb-2">Access Denied</h2>
              <p className="text-slate-400 mb-6">
                You don't have permission to access this page.
              </p>
              <button
                onClick={() => window.history.back()}
                className="bg-gradient-to-r from-teal-500 to-cyan-600 text-white py-2 px-6
                         rounded-lg font-semibold hover:from-teal-600 hover:to-cyan-700
                         transition-all"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  // User is authenticated and has required role
  return <>{children}</>;
};

export default ProtectedRoute;
