import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { FileDown, FileText, Calendar, DollarSign } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import apiService, { Employee } from "@/lib/api"
import { 
  generateContractorPayslipPDF, 
  exportPayslipCSV,
  downloadFile,
  ContractorPayrollData
} from "@/utils/payslipExport"

// Sample payroll records for contract staff
const samplePayrollRecords = [
  {
    id: "PAY-C001",
    period: "2024-01",
    month: "January",
    year: "2024",
    contractFee: 500000,
    withholdingTax: 10000,
    netPay: 490000,
    status: "Paid"
  },
  {
    id: "PAY-C002",
    period: "2023-12",
    month: "December",
    year: "2023",
    contractFee: 500000,
    withholdingTax: 10000,
    netPay: 490000,
    status: "Paid"
  },
  {
    id: "PAY-C003",
    period: "2023-11",
    month: "November",
    year: "2023",
    contractFee: 500000,
    withholdingTax: 10000,
    netPay: 490000,
    status: "Paid"
  }
]

export const ContractStaffDashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const [employeeData, setEmployeeData] = useState<Employee | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchEmployeeData = async () => {
      try {
        const employees = await apiService.getEmployees()
        // Find employee matching the logged in user
        const emp = employees.find(e => e.email === user?.email)
        setEmployeeData(emp || null)
      } catch (error) {
        console.error('Failed to fetch employee data:', error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchEmployeeData()
  }, [user?.email])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: "default" | "secondary" | "destructive" | "outline", className: string }> = {
      Paid: { variant: "default", className: "bg-success text-white" },
      Processed: { variant: "secondary", className: "bg-primary text-white" },
      Draft: { variant: "outline", className: "" }
    }
    const config = statusConfig[status] || statusConfig.Draft
    return <Badge variant={config.variant} className={config.className}>{status}</Badge>
  }

  const handleDownloadPayslipPDF = (record: typeof samplePayrollRecords[0]) => {
    if (!employeeData) {
      toast({
        title: "Error",
        description: "Employee data not found",
        variant: "destructive"
      })
      return
    }

    const payrollData: ContractorPayrollData = {
      employee: employeeData,
      month: record.month,
      year: record.year,
      contractFee: record.contractFee,
      withholdingTax: record.withholdingTax,
      netPay: record.netPay
    }

    const doc = generateContractorPayslipPDF(payrollData)
    doc.save(`${employeeData.first_name}_${employeeData.last_name}_Payslip.pdf`)

    toast({
      title: "Success",
      description: "Payslip downloaded successfully"
    })
  }

  const handleDownloadPayslipCSV = (record: typeof samplePayrollRecords[0]) => {
    if (!employeeData) {
      toast({
        title: "Error",
        description: "Employee data not found",
        variant: "destructive"
      })
      return
    }

    const payrollData: ContractorPayrollData = {
      employee: employeeData,
      month: record.month,
      year: record.year,
      contractFee: record.contractFee,
      withholdingTax: record.withholdingTax,
      netPay: record.netPay
    }

    const csvContent = exportPayslipCSV(payrollData)
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `${employeeData.first_name}_${employeeData.last_name}_Payslip.csv`)

    toast({
      title: "Success",
      description: "CSV exported successfully"
    })
  }

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="h-32 bg-muted rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-8 space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-3xl font-bold text-primary">
          Welcome, {user?.firstName} {user?.lastName}
        </h1>
        <p className="text-muted-foreground mt-1">Contract Staff Self-Service Portal</p>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Month Payment</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(samplePayrollRecords[0].netPay)}</div>
            <p className="text-xs text-muted-foreground">
              {samplePayrollRecords[0].month} {samplePayrollRecords[0].year}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Fee</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(samplePayrollRecords[0].contractFee)}</div>
            <p className="text-xs text-muted-foreground">
              Gross amount before tax
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withholding Tax</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(samplePayrollRecords[0].withholdingTax)}</div>
            <p className="text-xs text-muted-foreground">
              2% of contract fee
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card>
        <CardHeader>
          <CardTitle>Payslip History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead>Contract Fee</TableHead>
                  <TableHead>Withholding Tax (2%)</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {samplePayrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">
                      {record.month} {record.year}
                    </TableCell>
                    <TableCell>{formatCurrency(record.contractFee)}</TableCell>
                    <TableCell>{formatCurrency(record.withholdingTax)}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(record.netPay)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPayslipPDF(record)}
                          title="Download PDF Payslip"
                        >
                          <FileDown className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownloadPayslipCSV(record)}
                          title="Download CSV Payslip"
                        >
                          <FileText className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Profile Information */}
      {employeeData && (
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{employeeData.first_name} {employeeData.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{employeeData.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Department</p>
                <p className="font-medium">{employeeData.department || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Employment Type</p>
                <p className="font-medium">{employeeData.employment_type || 'Contract'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
