import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import Recruitment from "./pages/Recruitment";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";
import Performance from "./pages/Performance";
import Training from "./pages/Training";
import Benefits from "./pages/Benefits";
import Analytics from "./pages/Analytics";
import Reports from "./pages/Reports";
import Security from "./pages/Security";
import Announcements from "./pages/Announcements";
import Policies from "./pages/Policies";
import { useEffect, useState } from "react";
import { getUsers } from "./api";

const queryClient = new QueryClient();

const App = () => {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    getUsers().then(setUsers);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/employees" element={<Employees />} />
                <Route path="/attendance" element={<Attendance />} />
                <Route path="/recruitment" element={<Recruitment />} />
                <Route path="/payroll" element={<Payroll />} />
                <Route path="/performance" element={<Performance />} />
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
                <Route
                  path="/settings"
                  element={
                    <ComingSoon
                      title="Settings"
                      description="System configuration and preferences"
                    />
                  }
                />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Layout>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
};

export default App;
