import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Recruitment from "./pages/Recruitment";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import Performance from "./pages/Performance";
import PerformanceCycles from "./pages/PerformanceCycles";
import PerformanceReviewDetail from "./pages/PerformanceReviewDetail";
import Settings from "./pages/Settings";
import Training from "./pages/Training";
import Benefits from "./pages/Benefits";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Security from "./pages/Security";
import Announcements from "./pages/Announcements";
import Policies from "./pages/Policies";
import MyProfile from "./pages/MyProfile";
import Notifications from "./pages/Notifications";
import LeaveApprovals from "./pages/LeaveApprovals";
import MyPayslips from "./pages/MyPayslips";
import PayslipDetail from "./pages/PayslipDetail";
import PayrollReview from "./pages/PayrollReview";
import ManagerApprovals from "./pages/attendance/ManagerApprovals";
import OrgAttendanceDashboard from "./pages/attendance/OrgAttendanceDashboard";
import ExecutiveView from "./pages/ExecutiveView";
import React, { useEffect, useState } from "react";
import { getUsers } from "./api";
import { PasswordChangeModal } from "./components/PasswordChangeModal";
import { UpdateAvailableBanner } from "./components/UpdateAvailableBanner";
import { PwaInstallPrompt } from "./components/PwaInstallPrompt";

const queryClient = new QueryClient();

// Create a wrapper component that uses useAuth
const AppContent = () => {
  const { user, refreshUser, isAuthenticated } = useAuth();
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  useEffect(() => {
    if (user?.mustChangePassword) {
      setShowPasswordChange(true);
    } else {
      setShowPasswordChange(false);
    }
  }, [user]);

  // Protected Route Component - defined inside AppContent to ensure it's within AuthProvider
  const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    
    return <>{children}</>;
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <Layout>
                <Routes>
                  <Route
                    path="/"
                    element={
                      // Only the executive role auto-lands on Chairman's View.
                      // Corporate HR (and other roles) must land on the standard Dashboard.
                      user?.role === "executive" ? (
                        <Navigate to="/executive" replace />
                      ) : (
                        <Dashboard />
                      )
                    }
                  />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/executive" element={<ExecutiveView />} />
                  <Route path="/employees" element={<Employees />} />
                  <Route path="/attendance" element={<Attendance />} />
                  <Route path="/recruitment" element={<Recruitment />} />
                  <Route path="/payroll" element={<Payroll />} />
                  <Route path="/performance" element={<Performance />} />
                  <Route path="/performance/cycles" element={<PerformanceCycles />} />
                  <Route path="/performance/:id" element={<PerformanceReviewDetail />} />
                  <Route path="/training" element={<Training />} />
                  <Route path="/benefits" element={<Benefits />} />
                  <Route path="/analytics" element={<Analytics />} />
                  <Route
                    path="/time"
                    element={
                      <ComingSoon
                        title="Time Tracking"
                        description="Advanced time and attendance tracking"
                      />
                    }
                  />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/announcements" element={<Announcements />} />
                  <Route path="/policies" element={<Policies />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/my-profile" element={<MyProfile />} />
                  <Route path="/notifications" element={<Notifications />} />
                  <Route path="/approvals/leave" element={<LeaveApprovals />} />
                  <Route path="/approvals/attendance" element={<ManagerApprovals />} />
                  <Route path="/attendance/org-dashboard" element={<OrgAttendanceDashboard />} />
                  <Route path="/payroll/my-payslips" element={<MyPayslips />} />
                  <Route path="/payroll/my-payslips/:period" element={<PayslipDetail />} />
                  <Route path="/payroll/review/:payPeriod" element={<PayrollReview />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
        </Routes>
      </BrowserRouter>
      
      <PasswordChangeModal 
        isOpen={showPasswordChange} 
        onPasswordChanged={async () => {
          await refreshUser(); // Refresh user data from backend
          setShowPasswordChange(false); // Close the modal
        }}
        onDismiss={() => {
          setShowPasswordChange(false); // Allow user to dismiss
        }}
      />
    </>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppContent />
            <UpdateAvailableBanner />
            <PwaInstallPrompt />
          </TooltipProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
