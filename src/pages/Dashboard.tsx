import { DashboardStats } from "@/components/DashboardStats"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Plus, Download, Upload, FileText } from "lucide-react"

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome to Emerald HRIS - Your complete HR management solution
          </p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="sm">
            <Upload className="mr-2 h-4 w-4" />
            Import Data
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Reports
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Add Employee
          </Button>
        </div>
      </div>

      <DashboardStats />

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <FileText className="mr-2 h-5 w-5" />
              Recent Activities
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>New employee onboarded</span>
                <span className="text-muted-foreground">2 hours ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Payroll processed for March</span>
                <span className="text-muted-foreground">1 day ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Leave request approved</span>
                <span className="text-muted-foreground">2 days ago</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Performance review completed</span>
                <span className="text-muted-foreground">3 days ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Pending Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">Leave requests to approve</span>
                <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                  5 pending
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Performance reviews due</span>
                <span className="bg-destructive/10 text-destructive px-2 py-1 rounded text-xs font-medium">
                  12 overdue
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Training completions</span>
                <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                  8 completed
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Document uploads needed</span>
                <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                  3 missing
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Nigerian Compliance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm">PAYE Tax Remittance</span>
                <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                  Up to date
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Pension Contributions</span>
                <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                  Current
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">NHF Contributions</span>
                <span className="bg-warning/10 text-warning px-2 py-1 rounded text-xs font-medium">
                  Due 15th
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">ITF/NSITF Payments</span>
                <span className="bg-success/10 text-success px-2 py-1 rounded text-xs font-medium">
                  Paid
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}