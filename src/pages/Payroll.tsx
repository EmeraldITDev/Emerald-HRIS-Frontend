import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calculator, Download, FileText, Lock, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Sample payroll data
const payrollRecords = [
  {
    id: "PAY001",
    employeeId: "EMP001",
    employeeName: "Adebayo Johnson",
    basicSalary: 2500000,
    allowances: 500000,
    grossPay: 3000000,
    paye: 450000,
    pension: 240000,
    nhf: 75000,
    netPay: 2235000,
    period: "2024-01",
    status: "Paid"
  },
  {
    id: "PAY002",
    employeeId: "EMP002",
    employeeName: "Fatima Abdul",
    basicSalary: 1800000,
    allowances: 360000,
    grossPay: 2160000,
    paye: 216000,
    pension: 172800,
    nhf: 54000,
    netPay: 1717200,
    period: "2024-01",
    status: "Processed"
  }
]

const employees = [
  { id: "EMP001", name: "Adebayo Johnson", basicSalary: 2500000, pensionId: "PEN123456", taxId: "TIN789012", employmentType: "Full-time" },
  { id: "EMP002", name: "Fatima Abdul", basicSalary: 1800000, pensionId: "PEN654321", taxId: "TIN345678", employmentType: "Full-time" },
  { id: "EMP003", name: "Chinedu Okafor", basicSalary: 1200000, pensionId: "PEN111222", taxId: "TIN999888", employmentType: "Contract" },
  { id: "EMP004", name: "Kemi Adeleke", basicSalary: 950000, pensionId: "PEN333444", taxId: "TIN777666", employmentType: "Full-time" },
]

export default function Payroll() {
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("")
  const [payrollData, setPayrollData] = useState({
    grossSalary: "",
    housingAllowance: "",
    transportAllowance: "",
    otherAllowance: "",
    overtimeHours: "",
    overtimeRate: "",
    bonuses: "",
  })
  const { toast } = useToast()

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculatePayroll = () => {
    const gross = parseFloat(payrollData.grossSalary) || 0
    const housing = parseFloat(payrollData.housingAllowance) || 0
    const transport = parseFloat(payrollData.transportAllowance) || 0
    const other = parseFloat(payrollData.otherAllowance) || 0
    const bonuses = parseFloat(payrollData.bonuses) || 0
    const overtimeHours = parseFloat(payrollData.overtimeHours) || 0
    const overtimeRate = parseFloat(payrollData.overtimeRate) || 0
    
    const overtimePay = overtimeHours * overtimeRate
    const grossPay = gross + housing + transport + other + bonuses + overtimePay
    
    // Nigerian statutory deductions
    const pensionEmployee = grossPay * 0.08 // Employee 8%
    const pensionEmployer = grossPay * 0.10 // Employer 10%
    const nhf = grossPay * 0.025 // 2.5%
    const nsitf = grossPay * 0.01 // 1% (employer paid)
    const itf = grossPay * 0.01 // 1% (employer paid)
    
    // PAYE calculation (simplified)
    let paye = 0
    const taxableIncome = grossPay - pensionEmployee
    if (taxableIncome > 300000) {
      if (taxableIncome <= 600000) {
        paye = (taxableIncome - 300000) * 0.07
      } else if (taxableIncome <= 1100000) {
        paye = 21000 + (taxableIncome - 600000) * 0.11
      } else if (taxableIncome <= 1600000) {
        paye = 76000 + (taxableIncome - 1100000) * 0.15
      } else if (taxableIncome <= 3200000) {
        paye = 151000 + (taxableIncome - 1600000) * 0.19
      } else {
        paye = 455000 + (taxableIncome - 3200000) * 0.21
      }
    }
    
    const totalDeductions = pensionEmployee + nhf + paye
    const netPay = grossPay - totalDeductions
    const totalEmployerCost = grossPay + pensionEmployer + nsitf + itf
    
    return {
      grossPay,
      pensionEmployee,
      pensionEmployer,
      nhf,
      nsitf,
      itf,
      paye,
      totalDeductions,
      netPay,
      totalEmployerCost,
      overtimePay
    }
  }

  const calculations = calculatePayroll()

  const savePayroll = () => {
    if (!selectedEmployee || !selectedPeriod) return

    const selectedEmp = employees.find(emp => emp.id === selectedEmployee)
    if (!selectedEmp) return

    // Update employee salary in the system
    const employeeIndex = employees.findIndex(emp => emp.id === selectedEmployee)
    if (employeeIndex !== -1) {
      employees[employeeIndex].basicSalary = calculations.netPay
    }

    // Create payroll record
    const newPayrollRecord = {
      id: `PAY${String(payrollRecords.length + 1).padStart(3, '0')}`,
      employeeId: selectedEmployee,
      employeeName: selectedEmp.name,
      basicSalary: parseFloat(payrollData.grossSalary) || 0,
      allowances: (parseFloat(payrollData.housingAllowance) || 0) + 
                  (parseFloat(payrollData.transportAllowance) || 0) + 
                  (parseFloat(payrollData.otherAllowance) || 0) + 
                  (parseFloat(payrollData.bonuses) || 0) + calculations.overtimePay,
      grossPay: calculations.grossPay,
      paye: calculations.paye,
      pension: calculations.pensionEmployee,
      nhf: calculations.nhf,
      netPay: calculations.netPay,
      period: selectedPeriod,
      status: "Processed"
    }

    payrollRecords.push(newPayrollRecord)

    toast({
      title: "Payroll Saved",
      description: `Payroll for ${selectedEmp.name} has been saved and employee salary updated to ${formatCurrency(calculations.netPay)}.`
    })

    // Reset form
    setPayrollData({
      grossSalary: "",
      housingAllowance: "",
      transportAllowance: "",
      otherAllowance: "",
      overtimeHours: "",
      overtimeRate: "",
      bonuses: "",
    })
    setSelectedEmployee("")
    setSelectedPeriod("")
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Paid</Badge>
      case "Processed":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Processed</Badge>
      case "Draft":
        return <Badge className="bg-muted/10 text-muted-foreground border-muted/20 text-xs">Draft</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nigerian Payroll</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Generate payroll with full Nigerian tax compliance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Tax Settings
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Payroll
          </Button>
          <Button size="sm">
            <Lock className="mr-2 h-4 w-4" />
            Lock Period
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Payroll Calculator */}
        <Card className="lg:col-span-1 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <Calculator className="mr-2 h-5 w-5" />
              Payroll Calculator
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Pay Period</Label>
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger>
                  <SelectValue placeholder="Select period" />
                </SelectTrigger>
                <SelectContent className="bg-popover border shadow-lg">
                  <SelectItem value="2024-01">January 2024</SelectItem>
                  <SelectItem value="2024-02">February 2024</SelectItem>
                  <SelectItem value="2024-03">March 2024</SelectItem>
                  <SelectItem value="2024-04">April 2024</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="grossSalary">Gross Salary (₦)</Label>
                <Input
                  id="grossSalary"
                  type="number"
                  placeholder="2,500,000"
                  value={payrollData.grossSalary}
                  onChange={(e) => setPayrollData({...payrollData, grossSalary: e.target.value})}
                />
              </div>

              {selectedEmployee && employees.find(emp => emp.id === selectedEmployee)?.employmentType === "Full-time" && (
                <>
                  <div>
                    <Label htmlFor="housingAllowance">Housing Allowance (₦)</Label>
                    <Input
                      id="housingAllowance"
                      type="number"
                      placeholder="300,000"
                      value={payrollData.housingAllowance}
                      onChange={(e) => setPayrollData({...payrollData, housingAllowance: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="transportAllowance">Transport Allowance (₦)</Label>
                    <Input
                      id="transportAllowance"
                      type="number"
                      placeholder="100,000"
                      value={payrollData.transportAllowance}
                      onChange={(e) => setPayrollData({...payrollData, transportAllowance: e.target.value})}
                    />
                  </div>

                  <div>
                    <Label htmlFor="otherAllowance">Other Allowance (₦)</Label>
                    <Input
                      id="otherAllowance"
                      type="number"
                      placeholder="50,000"
                      value={payrollData.otherAllowance}
                      onChange={(e) => setPayrollData({...payrollData, otherAllowance: e.target.value})}
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="overtimeHours">OT Hours</Label>
                  <Input
                    id="overtimeHours"
                    type="number"
                    placeholder="10"
                    value={payrollData.overtimeHours}
                    onChange={(e) => setPayrollData({...payrollData, overtimeHours: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="overtimeRate">OT Rate (₦/hr)</Label>
                  <Input
                    id="overtimeRate"
                    type="number"
                    placeholder="5000"
                    value={payrollData.overtimeRate}
                    onChange={(e) => setPayrollData({...payrollData, overtimeRate: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="bonuses">Bonuses (₦)</Label>
                <Input
                  id="bonuses"
                  type="number"
                  placeholder="250,000"
                  value={payrollData.bonuses}
                  onChange={(e) => setPayrollData({...payrollData, bonuses: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payroll Breakdown */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Payroll Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Earnings */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Earnings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Gross Salary:</span>
                      <span>{formatCurrency(parseFloat(payrollData.grossSalary) || 0)}</span>
                    </div>
                    {selectedEmployee && employees.find(emp => emp.id === selectedEmployee)?.employmentType === "Full-time" && (
                      <>
                        <div className="flex justify-between text-sm">
                          <span>Housing Allowance:</span>
                          <span>{formatCurrency(parseFloat(payrollData.housingAllowance) || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Transport Allowance:</span>
                          <span>{formatCurrency(parseFloat(payrollData.transportAllowance) || 0)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Other Allowance:</span>
                          <span>{formatCurrency(parseFloat(payrollData.otherAllowance) || 0)}</span>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overtime Pay:</span>
                      <span>{formatCurrency(calculations.overtimePay)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Bonuses:</span>
                      <span>{formatCurrency(parseFloat(payrollData.bonuses) || 0)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span>Gross Pay:</span>
                      <span className="text-primary">{formatCurrency(calculations.grossPay)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Deductions */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Statutory Deductions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>PAYE Tax:</span>
                      <span>{formatCurrency(calculations.paye)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Pension (Employee 8%):</span>
                      <span>{formatCurrency(calculations.pensionEmployee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>NHF (2.5%):</span>
                      <span>{formatCurrency(calculations.nhf)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span>Total Deductions:</span>
                      <span className="text-destructive">{formatCurrency(calculations.totalDeductions)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-lg border-t pt-2">
                      <span>Net Pay:</span>
                      <span className="text-success">{formatCurrency(calculations.netPay)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Employer Costs */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Employer Costs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Pension (Employer 10%):</span>
                      <span>{formatCurrency(calculations.pensionEmployer)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>NSITF (1%):</span>
                      <span>{formatCurrency(calculations.nsitf)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>ITF (1%):</span>
                      <span>{formatCurrency(calculations.itf)}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-semibold border-t pt-2">
                      <span>Total Employer Cost:</span>
                      <span className="text-primary">{formatCurrency(calculations.totalEmployerCost)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Save Payroll Button */}
              <div className="flex justify-end border-t pt-4">
                <Button 
                  onClick={() => savePayroll()}
                  disabled={!selectedEmployee || !selectedPeriod || !payrollData.grossSalary}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  Save Payroll & Update Employee Record
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <Card className="border-border/50 shadow-sm">
        <CardHeader>
          <CardTitle className="text-primary">Payroll History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs md:text-sm">Employee</TableHead>
                  <TableHead className="text-xs md:text-sm">Period</TableHead>
                  <TableHead className="hidden md:table-cell text-xs md:text-sm">Basic Salary</TableHead>
                  <TableHead className="hidden lg:table-cell text-xs md:text-sm">Gross Pay</TableHead>
                  <TableHead className="text-xs md:text-sm">PAYE</TableHead>
                  <TableHead className="text-xs md:text-sm">Net Pay</TableHead>
                  <TableHead className="text-xs md:text-sm">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium text-xs md:text-sm">{record.employeeName}</TableCell>
                    <TableCell className="text-xs md:text-sm">{record.period}</TableCell>
                    <TableCell className="hidden md:table-cell text-xs md:text-sm">{formatCurrency(record.basicSalary)}</TableCell>
                    <TableCell className="hidden lg:table-cell text-xs md:text-sm">{formatCurrency(record.grossPay)}</TableCell>
                    <TableCell className="text-xs md:text-sm">{formatCurrency(record.paye)}</TableCell>
                    <TableCell className="font-medium text-xs md:text-sm">{formatCurrency(record.netPay)}</TableCell>
                    <TableCell>{getStatusBadge(record.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}