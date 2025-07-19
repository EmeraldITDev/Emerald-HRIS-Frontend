import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import Payroll from "./pages/Payroll";
import ComingSoon from "./pages/ComingSoon";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/employees" element={<Employees />} />
            <Route path="/attendance" element={<Attendance />} />
            <Route path="/recruitment" element={<ComingSoon title="Recruitment Tracker" description="Manage job openings and candidate applications" />} />
            <Route path="/payroll" element={<Payroll />} />
            <Route path="/performance" element={<ComingSoon title="Performance Reviews" description="Manage employee performance evaluations" />} />
            <Route path="/training" element={<ComingSoon title="Training & Development" description="Track training programs and certifications" />} />
            <Route path="/benefits" element={<ComingSoon title="Benefits Administration" description="Manage employee benefits and enrollments" />} />
            <Route path="/analytics" element={<ComingSoon title="People Analytics" description="View comprehensive HR reports and insights" />} />
            <Route path="/time" element={<ComingSoon title="Time Tracking" description="Advanced time and attendance tracking" />} />
            <Route path="/reports" element={<ComingSoon title="Reports" description="Generate and export detailed HR reports" />} />
            <Route path="/announcements" element={<ComingSoon title="Announcements" description="Internal company announcements and communications" />} />
            <Route path="/security" element={<ComingSoon title="Security & Admin" description="System security controls and user management" />} />
            <Route path="/settings" element={<ComingSoon title="Settings" description="System configuration and preferences" />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
