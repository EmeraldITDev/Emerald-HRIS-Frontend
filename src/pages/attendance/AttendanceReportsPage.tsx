import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { canViewAttendanceReports } from "@/lib/permissions";
import AttendanceReportPanel, {
  type PeriodPreset,
} from "@/components/attendance/AttendanceReportPanel";

const PRESETS: PeriodPreset[] = ["weekly", "monthly", "yearly", "custom"];

export default function AttendanceReportsPage() {
  const { user } = useAuth();
  const { preset } = useParams<{ preset?: string }>();

  if (!canViewAttendanceReports(user)) {
    return <Navigate to="/attendance" replace />;
  }

  const initialPreset = (PRESETS.includes((preset || "weekly") as PeriodPreset)
    ? preset
    : "weekly") as PeriodPreset;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">Attendance Reports</h1>
        <p className="text-sm text-muted-foreground">
          Preview period attendance, then download PDF or Excel using the same calculated dataset.
        </p>
      </div>
      <AttendanceReportPanel key={initialPreset} initialPreset={initialPreset} standalone />
    </div>
  );
}
