import React from "react";
import { HashRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Layout/Header";
import { Home } from "./pages/Home";
import { ContractInitiation } from "./pages/ContractInitiation";
import { LeaseCalculations } from "./pages/LeaseCalculations";
import { DisclosureJournals } from "./pages/DisclosureJournals";
import { Methodology } from "./pages/Methodology";
import { Education } from "./pages/Education";
import { Dashboard } from "./pages/Dashboard";
import { Reports } from "./pages/Reports";
import { ApprovalDashboard } from "./pages/ApprovalDashboard";
import Login from "./pages/Login";
import { LeaseProvider } from "./context/LeaseContext";
import { ThemeProvider } from "./context/ThemeContext";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/Auth/ProtectedRoute";
import { LoginModal } from "./components/Auth/LoginModal";
import { useAuth } from "./context/AuthContext";

// Component to handle LoginModal globally
function AppContent() {
  const { showLoginModal, closeLoginModal } = useAuth();

  return (
    <Router>
      <Routes>
        {/* Public route - Login (keep for backwards compatibility) */}
        <Route path="/login" element={<Login />} />

        {/* Public Home page with Header */}
        <Route
          path="/"
          element={
            <div className="flex flex-col h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
              <Header />
              <main className="flex-1 overflow-x-hidden overflow-y-auto">
                <Home />
              </main>
            </div>
          }
        />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <div className="flex flex-col h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-gray-100">
                <Header />
                <main className="flex-1 overflow-x-hidden overflow-y-auto">
                  <Routes>
                    <Route path="/contract" element={<ContractInitiation />} />
                    <Route path="/calculations" element={<LeaseCalculations />} />
                    <Route
                      path="/disclosure-journals"
                      element={<DisclosureJournals />}
                    />
                    <Route path="/methodology" element={<Methodology />} />
                    <Route path="/education" element={<Education />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route
                      path="/approvals"
                      element={
                        <ProtectedRoute requiredRoles={['approver', 'admin']}>
                          <ApprovalDashboard />
                        </ProtectedRoute>
                      }
                    />
                    <Route path="/reports" element={<Reports />} />
                  </Routes>
                </main>
              </div>
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Global Login Modal - Inside Router */}
      <LoginModal isOpen={showLoginModal} onClose={closeLoginModal} />
    </Router>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <LeaseProvider>
          <AppContent />
        </LeaseProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
