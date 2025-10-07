import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Download, FileText, Lock, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { RoleBasedComponent } from "@/components/RoleBasedComponent";

// Sample payroll data with realistic values for different roles
const payrollRecords = [
// Executive Role - James Thompson (CEO)
{
  id: "PAY001",
  employeeId: "EMP001",
  employeeName: "James Thompson",
  department: "Executive",
  role: "executive",
  basicSalary: 8000000,
  allowances: 12000000,
  grossPay: 20000000,
  paye: 3855000,
  pension: 1440000,
  nhf: 500000,
  netPay: 14205000,
  period: "2024-01",
  status: "Paid"
},
// HR Manager - Sarah Williams
{
  id: "PAY002",
  employeeId: "EMP002",
  employeeName: "Sarah Williams",
  department: "Human Resource",
  role: "hr_manager",
  basicSalary: 4000000,
  allowances: 6000000,
  grossPay: 10000000,
  paye: 1855000,
  pension: 720000,
  nhf: 250000,
  netPay: 7175000,
  period: "2024-01",
  status: "Paid"
},
// Corporate HR - Emily Johnson
{
  id: "PAY003",
  employeeId: "EMP003",
  employeeName: "Emily Johnson",
  department: "Human Resource",
  role: "corporate_hr",
  basicSalary: 2000000,
  allowances: 3000000,
  grossPay: 5000000,
  paye: 705000,
  pension: 360000,
  nhf: 125000,
  netPay: 3810000,
  period: "2024-01",
  status: "Paid"
},
// Line Manager - Michael Brown
{
  id: "PAY004",
  employeeId: "EMP004",
  employeeName: "Michael Brown",
  department: "Operations",
  role: "line_manager",
  basicSalary: 2400000,
  allowances: 3600000,
  grossPay: 6000000,
  paye: 930000,
  pension: 432000,
  nhf: 150000,
  netPay: 4488000,
  period: "2024-01",
  status: "Paid"
},
// IT Power User - David Martinez
{
  id: "PAY005",
  employeeId: "EMP005",
  employeeName: "David Martinez",
  department: "IT",
  role: "it_power_user",
  basicSalary: 3200000,
  allowances: 4800000,
  grossPay: 8000000,
  paye: 1380000,
  pension: 576000,
  nhf: 200000,
  netPay: 5844000,
  period: "2024-01",
  status: "Paid"
},
// IT Admin - Alex Chen
{
  id: "PAY006",
  employeeId: "EMP006",
  employeeName: "Alex Chen",
  department: "IT",
  role: "it_admin",
  basicSalary: 2000000,
  allowances: 3000000,
  grossPay: 5000000,
  paye: 705000,
  pension: 360000,
  nhf: 125000,
  netPay: 3810000,
  period: "2024-01",
  status: "Paid"
},
// General Employee - Adebayo Johnson
{
  id: "PAY007",
  employeeId: "EMP007",
  employeeName: "Adebayo Johnson",
  department: "Business Development",
  role: "general_employee",
  basicSalary: 1600000,
  allowances: 2400000,
  grossPay: 4000000,
  paye: 480000,
  pension: 288000,
  nhf: 100000,
  netPay: 3132000,
  period: "2024-01",
  status: "Paid"
},
// General Employee - Fatima Abdul
{
  id: "PAY008",
  employeeId: "EMP008",
  employeeName: "Fatima Abdul",
  department: "Finance",
  role: "general_employee",
  basicSalary: 1800000,
  allowances: 2700000,
  grossPay: 4500000,
  paye: 580500,
  pension: 324000,
  nhf: 112500,
  netPay: 3483000,
  period: "2024-01",
  status: "Paid"
},
// Contract Employee - Chinedu Okafor
{
  id: "PAY009",
  employeeId: "EMP009",
  employeeName: "Chinedu Okafor",
  department: "Technical Operations",
  role: "contract_employee",
  basicSalary: 0,
  // Contract staff don't have basic salary
  allowances: 0,
  // No allowances for contract staff
  grossPay: 1200000,
  // Only gross contract amount
  paye: 60000,
  // 5% Withholding Tax for contract
  pension: 0,
  // No pension for contract staff
  nhf: 0,
  // No NHF for contract staff
  netPay: 1140000,
  period: "2024-01",
  status: "Processed"
},
// General Employee - Kemi Adeleke
{
  id: "PAY010",
  employeeId: "EMP010",
  employeeName: "Kemi Adeleke",
  department: "Legal",
  role: "general_employee",
  basicSalary: 1400000,
  allowances: 2100000,
  grossPay: 3500000,
  paye: 380000,
  pension: 252000,
  nhf: 87500,
  netPay: 2780500,
  period: "2024-01",
  status: "Paid"
}];
const employees = [{
  id: "EMP001",
  name: "James Thompson",
  basicSalary: 8000000,
  pensionId: "PEN001",
  taxId: "TIN001",
  employmentType: "Full-time",
  status: "On-board",
  role: "executive"
}, {
  id: "EMP002",
  name: "Sarah Williams",
  basicSalary: 4000000,
  pensionId: "PEN002",
  taxId: "TIN002",
  employmentType: "Full-time",
  status: "On-board",
  role: "hr_manager"
}, {
  id: "EMP003",
  name: "Emily Johnson",
  basicSalary: 2000000,
  pensionId: "PEN003",
  taxId: "TIN003",
  employmentType: "Full-time",
  status: "On-board",
  role: "corporate_hr"
}, {
  id: "EMP004",
  name: "Michael Brown",
  basicSalary: 2400000,
  pensionId: "PEN004",
  taxId: "TIN004",
  employmentType: "Full-time",
  status: "On-board",
  role: "line_manager"
}, {
  id: "EMP005",
  name: "David Martinez",
  basicSalary: 3200000,
  pensionId: "PEN005",
  taxId: "TIN005",
  employmentType: "Full-time",
  status: "On-board",
  role: "it_power_user"
}, {
  id: "EMP006",
  name: "Alex Chen",
  basicSalary: 2000000,
  pensionId: "PEN006",
  taxId: "TIN006",
  employmentType: "Full-time",
  status: "On-board",
  role: "it_admin"
}, {
  id: "EMP007",
  name: "Adebayo Johnson",
  basicSalary: 1600000,
  pensionId: "PEN007",
  taxId: "TIN007",
  employmentType: "Full-time",
  status: "On-board",
  role: "general_employee"
}, {
  id: "EMP008",
  name: "Fatima Abdul",
  basicSalary: 1800000,
  pensionId: "PEN008",
  taxId: "TIN008",
  employmentType: "Full-time",
  status: "On-board",
  role: "general_employee"
}, {
  id: "EMP009",
  name: "Chinedu Okafor",
  basicSalary: 0,
  pensionId: "PEN009",
  taxId: "TIN009",
  employmentType: "Contract",
  status: "On-board",
  role: "contract_employee"
}, {
  id: "EMP010",
  name: "Kemi Adeleke",
  basicSalary: 1400000,
  pensionId: "PEN010",
  taxId: "TIN010",
  employmentType: "Full-time",
  status: "On-board",
  role: "general_employee"
}];

// Filter to show only On-board employees in dropdown
const onboardEmployees = employees.filter(emp => emp.status === "On-board");
export default function Payroll() {
  const [selectedEmployee, setSelectedEmployee] = useState("EMP007");
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01");
  const [payrollData, setPayrollData] = useState({
    grossSalary: "4000000",
    earnings: "50000",
    earningsRemarks: "",
    deduction: "25000",
    deductionRemarks: ""
  });
  const {
    toast
  } = useToast();
  const {
    user
  } = useAuth();

  // Filter payroll records based on user role
  const getVisiblePayrollRecords = () => {
    if (!user) return [];
    if (user.role === 'hr_manager' || user.role === 'executive' || user.role === 'finance') {
      // HR Manager, Executive, and Finance team can see all payroll records
      return payrollRecords;
    } else {
      // Other users can only see their own payroll
      return payrollRecords.filter(record => record.employeeId === user.email || record.employeeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase()));
    }
  };
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };
  const calculatePayroll = () => {
    const selectedEmp = onboardEmployees.find(emp => emp.id === selectedEmployee);
    const employmentType = selectedEmp?.employmentType || "Full-time";
    const gross = parseFloat(payrollData.grossSalary) || 0;
    const earnings = parseFloat(payrollData.earnings) || 0;
    const deduction = parseFloat(payrollData.deduction) || 0;
    let basic, housing, transport, other, pensionEmployee, pensionEmployer, nhf;
    if (employmentType === "Full-time") {
      // Full-time breakdown: 40% Basic, 20% Housing, 9% Transport, 31% Other
      basic = gross * 0.40;
      housing = gross * 0.20;
      transport = gross * 0.09;
      other = gross * 0.31;
    } else {
      // Contract: Only gross salary, no allowance breakdown
      basic = gross;
      housing = 0;
      transport = 0;
      other = 0;
    }

    // Add earnings to gross pay
    const grossPay = basic + housing + transport + other + earnings;

    // Nigerian statutory deductions - different for contract vs full-time
    if (employmentType === "Full-time") {
      const pensionableIncome = basic + housing + transport; // Pensionable income excludes other allowances
      pensionEmployee = pensionableIncome * 0.08; // Employee 8%
      pensionEmployer = pensionableIncome * 0.10; // Employer 10%
      nhf = grossPay * 0.025; // 2.5%
    } else {
      // Contract employees don't have pension or NHF deductions
      pensionEmployee = 0;
      pensionEmployer = 0;
      nhf = 0;
    }
    const nsitf = grossPay * 0.01; // 1% (employer paid)
    const itf = grossPay * 0.01; // 1% (employer paid)

    // Tax calculation based on employment type
    let tax = 0;
    let taxType = "";
    if (employmentType === "Full-time") {
      // PAYE calculation for full-time employees
      taxType = "PAYE";
      const taxableIncome = grossPay - pensionEmployee;
      if (taxableIncome > 300000) {
        if (taxableIncome <= 600000) {
          tax = (taxableIncome - 300000) * 0.07;
        } else if (taxableIncome <= 1100000) {
          tax = 21000 + (taxableIncome - 600000) * 0.11;
        } else if (taxableIncome <= 1600000) {
          tax = 76000 + (taxableIncome - 1100000) * 0.15;
        } else if (taxableIncome <= 3200000) {
          tax = 151000 + (taxableIncome - 1600000) * 0.19;
        } else {
          tax = 455000 + (taxableIncome - 3200000) * 0.21;
        }
      }
    } else {
      // Withholding Tax for contract employees (5% of gross)
      taxType = "Withholding Tax";
      tax = grossPay * 0.05;
    }

    // Add personal deduction to total deductions
    const totalDeductions = pensionEmployee + nhf + tax + deduction;
    const netPay = grossPay - totalDeductions;
    const totalEmployerCost = grossPay + pensionEmployer + nsitf + itf;
    return {
      grossPay,
      basic,
      housing,
      transport,
      other,
      earnings,
      deduction,
      pensionEmployee,
      pensionEmployer,
      nhf,
      nsitf,
      itf,
      tax,
      taxType,
      totalDeductions,
      netPay,
      totalEmployerCost,
      employmentType
    };
  };
  const calculations = calculatePayroll();
  const handleTaxSettings = () => {
    toast({
      title: "Tax Settings",
      description: "Tax settings panel will be available in the next update."
    });
  };
  const handleExportPayroll = () => {
    // Calculate comprehensive payroll data for all employees
    const exportData = onboardEmployees.map(employee => {
      // Use a standardized gross salary for calculation (could be their current basic salary)
      const grossSalary = employee.basicSalary;
      const employmentType = employee.employmentType;

      // Calculate all payroll components
      let basic, housing, transport, other;
      if (employmentType === "Full-time") {
        // Full-time breakdown: 40% Basic, 20% Housing, 9% Transport, 31% Other
        basic = grossSalary * 0.40;
        housing = grossSalary * 0.20;
        transport = grossSalary * 0.09;
        other = grossSalary * 0.31;
      } else {
        // Contract: Single gross amount
        basic = grossSalary;
        housing = 0;
        transport = 0;
        other = 0;
      }
      const grossPay = basic + housing + transport + other;

      // Nigerian statutory deductions
      const pensionableIncome = basic + housing + transport;
      const pensionEmployee = employmentType === "Full-time" ? pensionableIncome * 0.08 : 0;
      const pensionEmployer = employmentType === "Full-time" ? pensionableIncome * 0.10 : 0;
      const nhf = employmentType === "Full-time" ? grossPay * 0.025 : 0;
      const nsitf = grossPay * 0.01; // Employer paid
      const itf = grossPay * 0.01; // Employer paid

      // Tax calculation based on employment type
      let tax = 0;
      let taxType = "";
      if (employmentType === "Full-time") {
        // PAYE calculation for full-time employees
        taxType = "PAYE";
        const taxableIncome = grossPay - pensionEmployee;
        if (taxableIncome > 300000) {
          if (taxableIncome <= 600000) {
            tax = (taxableIncome - 300000) * 0.07;
          } else if (taxableIncome <= 1100000) {
            tax = 21000 + (taxableIncome - 600000) * 0.11;
          } else if (taxableIncome <= 1600000) {
            tax = 76000 + (taxableIncome - 1100000) * 0.15;
          } else if (taxableIncome <= 3200000) {
            tax = 151000 + (taxableIncome - 1600000) * 0.19;
          } else {
            tax = 455000 + (taxableIncome - 3200000) * 0.21;
          }
        }
      } else {
        // Withholding Tax for contract employees (5% of gross)
        taxType = "Withholding Tax";
        tax = grossPay * 0.05;
      }
      const totalDeductions = pensionEmployee + nhf + tax;
      const netPay = grossPay - totalDeductions;
      const totalEmployerCost = grossPay + pensionEmployer + nsitf + itf;
      return {
        'Employee ID': employee.id,
        'Employee Name': employee.name,
        'Employment Type': employmentType,
        'Gross Salary': grossSalary,
        'Basic Salary': basic,
        'Housing Allowance': housing,
        'Transport Allowance': transport,
        'Other Allowance': other,
        'PAYE/Withholding Tax': tax,
        'Employee Pension Contribution': pensionEmployee,
        'NHF': nhf,
        'Total Employee Deductions': totalDeductions,
        'Net Pay': netPay,
        'Employer Pension Contribution': pensionEmployer,
        'NSITF': nsitf,
        'ITF': itf,
        'Total Employer Cost': totalEmployerCost
      };
    });

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {});
    const csvContent = [headers.join(','), ...exportData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], {
      type: 'text/csv'
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comprehensive_payroll_export_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast({
      title: "Export Complete",
      description: `Comprehensive payroll data exported for ${exportData.length} employees with all salary components and deductions.`
    });
  };
  const handleLockPeriod = () => {
    toast({
      title: "Lock Period",
      description: "Period locking functionality will be available in the next update.",
      variant: "default"
    });
  };
  const savePayroll = () => {
    if (!selectedEmployee || !selectedPeriod) return;
    const selectedEmp = employees.find(emp => emp.id === selectedEmployee);
    if (!selectedEmp) return;

    // Update employee salary in the system
    const employeeIndex = employees.findIndex(emp => emp.id === selectedEmployee);
    if (employeeIndex !== -1) {
      employees[employeeIndex].basicSalary = calculations.netPay;
    }

    // Create payroll record
    const newPayrollRecord = {
      id: `PAY${String(payrollRecords.length + 1).padStart(3, '0')}`,
      employeeId: selectedEmployee,
      employeeName: selectedEmp.name,
      department: "Unknown",
      role: selectedEmp.role || "general_employee",
      basicSalary: calculations.employmentType === "Contract" ? 0 : calculations.basic,
      allowances: calculations.housing + calculations.transport + calculations.other,
      grossPay: calculations.grossPay,
      paye: calculations.tax,
      pension: calculations.pensionEmployee,
      nhf: calculations.nhf,
      netPay: calculations.netPay,
      period: selectedPeriod,
      status: "Processed"
    };
    payrollRecords.push(newPayrollRecord);
    toast({
      title: "Payroll Saved",
      description: `Payroll for ${selectedEmp.name} has been saved and employee salary updated to ${formatCurrency(calculations.netPay)}.`
    });

    // Reset form
    setPayrollData({
      grossSalary: "",
      earnings: "",
      earningsRemarks: "",
      deduction: "",
      deductionRemarks: ""
    });
    setSelectedEmployee("");
    setSelectedPeriod("");
  };
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Paid":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Paid</Badge>;
      case "Processed":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Processed</Badge>;
      case "Draft":
        return <Badge className="bg-muted/10 text-muted-foreground border-muted/20 text-xs">Draft</Badge>;
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>;
    }
  };
  return <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col space-y-3 md:space-y-0 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Nigerian Payroll</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Generate payroll with full Nigerian tax compliance
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <RoleBasedComponent allowedRoles={['hr_manager', 'executive']}>
            <Button variant="outline" size="sm" onClick={handleTaxSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Tax Settings
            </Button>
          </RoleBasedComponent>
          <RoleBasedComponent allowedRoles={['hr_manager', 'executive', 'finance']}>
            <Button variant="outline" size="sm" onClick={handleExportPayroll}>
              <Download className="mr-2 h-4 w-4" />
              Export Payroll
            </Button>
          </RoleBasedComponent>
          <RoleBasedComponent allowedRoles={['hr_manager']}>
            <Button size="sm" onClick={handleLockPeriod}>
              <Lock className="mr-2 h-4 w-4" />
              Lock Period
            </Button>
          </RoleBasedComponent>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Payroll Calculator - For HR Manager and Finance */}
        <RoleBasedComponent allowedRoles={['hr_manager', 'finance']}>
          <Card className="lg:col-span-1 border-border/50 shadow-sm">
            <CardHeader>
              <CardTitle className="text-primary flex items-center">
                <Calculator className="mr-2 h-5 w-5" />
                Payroll Calculator
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Calculate employee payroll with Nigerian tax compliance
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Employee *</Label>
                <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border shadow-lg">
                    {onboardEmployees.map(emp => <SelectItem key={emp.id} value={emp.id}>
                        {emp.name} - {emp.employmentType}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
                {selectedEmployee && <p className="text-xs text-muted-foreground">
                    Type: {onboardEmployees.find(e => e.id === selectedEmployee)?.employmentType}
                  </p>}
              </div>

              <div className="space-y-2">
                <Label>Pay Period *</Label>
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

              <div className="space-y-3 border-t pt-3">
                <div>
                  <Label htmlFor="grossSalary" className="font-semibold">
                    {calculations.employmentType === "Contract" ? "Contract Amount (₦) *" : "Gross Salary (₦) *"}
                  </Label>
                  <Input id="grossSalary" type="number" placeholder="2,500,000" value={payrollData.grossSalary} onChange={e => setPayrollData({
                  ...payrollData,
                  grossSalary: e.target.value
                })} />
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.employmentType === "Contract" ? "Total contract payment amount" : "Will be split: 40% Basic, 20% Housing, 9% Transport, 31% Other"}
                  </p>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">Additional Earnings</h4>
                  <div>
                    <Label htmlFor="earnings">Amount (₦)</Label>
                    <Input id="earnings" type="number" placeholder="50,000" value={payrollData.earnings} onChange={e => setPayrollData({
                    ...payrollData,
                    earnings: e.target.value
                  })} />
                  </div>
                  <div>
                    <Label htmlFor="earningsRemarks">Remarks</Label>
                    <Input id="earningsRemarks" type="text" placeholder="e.g., Overtime, Bonus" value={payrollData.earningsRemarks} onChange={e => setPayrollData({
                    ...payrollData,
                    earningsRemarks: e.target.value
                  })} />
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">Personal Deductions</h4>
                  <div>
                    <Label htmlFor="deduction">Amount (₦)</Label>
                    <Input id="deduction" type="number" placeholder="25,000" value={payrollData.deduction} onChange={e => setPayrollData({
                    ...payrollData,
                    deduction: e.target.value
                  })} />
                  </div>
                  <div>
                    <Label htmlFor="deductionRemarks">Remarks</Label>
                    <Input id="deductionRemarks" type="text" placeholder="e.g., Loan Repayment, Advance" value={payrollData.deductionRemarks} onChange={e => setPayrollData({
                    ...payrollData,
                    deductionRemarks: e.target.value
                  })} />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </RoleBasedComponent>

        {/* Payroll Breakdown */}
        <RoleBasedComponent allowedRoles={['executive', 'hr_manager', 'finance']}>
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Payroll Breakdown & Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Detailed breakdown of earnings, deductions, and employer costs
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Gross Pay</p>
                  <p className="text-xl font-bold text-primary">{formatCurrency(calculations.grossPay)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                  <p className="text-xl font-bold text-destructive">{formatCurrency(calculations.totalDeductions)}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Net Take Home</p>
                  <p className="text-xl font-bold text-success">{formatCurrency(calculations.netPay)}</p>
                </div>
              </div>

              {/* Employment Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={calculations.employmentType === "Contract" ? "secondary" : "default"}>
                  {calculations.employmentType === "Contract" ? "Contract Employee" : "Full-time Employee"}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Tax Type: {calculations.taxType}
                </span>
              </div>

              {/* Earnings */}
              <RoleBasedComponent allowedRoles={['executive', 'hr_manager', 'corporate_hr', 'line_manager', 'finance', 'it_power_user', 'contract_employee', 'general_employee']}>
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Earnings & Compensation
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm pb-2 border-b">
                    <span className="font-medium">{calculations.employmentType === "Contract" ? "Contract Amount" : "Base Gross Salary"}:</span>
                    <span className="font-semibold">{formatCurrency(parseFloat(payrollData.grossSalary) || 0)}</span>
                  </div>
                  {calculations.employmentType === "Full-time"}
                  {calculations.earnings > 0 && <div className="flex justify-between text-sm border-t pt-2 bg-success/5 p-2 rounded">
                      <span className="font-medium">
                        Additional Earnings
                        {payrollData.earningsRemarks && <span className="text-xs text-muted-foreground ml-2">({payrollData.earningsRemarks})</span>}:
                      </span>
                      <span className="text-success font-semibold">+{formatCurrency(calculations.earnings)}</span>
                    </div>}
                  <div className="flex justify-between text-base font-bold border-t-2 pt-3">
                    <span>Total Gross Pay:</span>
                    <span className="text-primary">{formatCurrency(calculations.grossPay)}</span>
                  </div>
                </div>
              </div>
              </RoleBasedComponent>

              {/* Deductions */}
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  Statutory Deductions
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{calculations.taxType}:</span>
                    <span>{formatCurrency(calculations.tax)}</span>
                  </div>
                  {calculations.employmentType === "Full-time" ? <>
                      <div className="flex justify-between text-sm">
                        <span>Pension Contribution (8%):</span>
                        <span>{formatCurrency(calculations.pensionEmployee)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>National Housing Fund (2.5%):</span>
                        <span>{formatCurrency(calculations.nhf)}</span>
                      </div>
                    </> : <div className="text-sm text-muted-foreground italic pl-4">
                      • No pension or NHF deductions for contract staff
                    </div>}
                  {calculations.deduction > 0 && <div className="flex justify-between text-sm border-t pt-2 bg-destructive/5 p-2 rounded">
                      <span className="font-medium">
                        Personal Deduction
                        {payrollData.deductionRemarks && <span className="text-xs text-muted-foreground ml-2">({payrollData.deductionRemarks})</span>}:
                      </span>
                      <span className="text-destructive font-semibold">-{formatCurrency(calculations.deduction)}</span>
                    </div>}
                  <div className="flex justify-between text-base font-bold border-t-2 pt-3">
                    <span>Total Deductions:</span>
                    <span className="text-destructive">{formatCurrency(calculations.totalDeductions)}</span>
                  </div>
                </div>
              </div>

              {/* Net Pay */}
              <div className="border-2 border-success rounded-lg p-4 bg-success/5">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Employee Net Take Home Pay</p>
                    <p className="text-3xl font-bold text-success">{formatCurrency(calculations.netPay)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Gross Pay</p>
                    <p className="text-sm font-semibold">{formatCurrency(calculations.grossPay)}</p>
                    <p className="text-xs text-destructive mt-1">- {formatCurrency(calculations.totalDeductions)}</p>
                  </div>
                </div>
              </div>

              {/* Employer Costs */}
              <div className="border rounded-lg p-4 bg-muted/20">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-primary rounded-full"></span>
                  Employer Additional Costs
                </h3>
                <div className="space-y-2">
                  {calculations.employmentType === "Full-time" ? <>
                      <div className="flex justify-between text-sm">
                        <span>Pension Contribution (10%):</span>
                        <span>{formatCurrency(calculations.pensionEmployer)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>NSITF Contribution (1%):</span>
                        <span>{formatCurrency(calculations.nsitf)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>ITF Contribution (1%):</span>
                        <span>{formatCurrency(calculations.itf)}</span>
                      </div>
                    </> : <div className="text-sm text-muted-foreground italic">
                      • Minimal employer costs for contract staff
                    </div>}
                  <div className="flex justify-between text-base font-bold border-t-2 pt-3">
                    <span>Total Employer Cost:</span>
                    <span className="text-primary">{formatCurrency(calculations.totalEmployerCost)}</span>
                  </div>
                </div>
              </div>

              {/* Save Payroll Button */}
              <RoleBasedComponent allowedRoles={['hr_manager', 'executive']}>
                <div className="flex justify-end border-t pt-4">
                  <Button onClick={() => savePayroll()} disabled={!selectedEmployee || !selectedPeriod || !payrollData.grossSalary} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    Save Payroll & Update Employee Record
                  </Button>
                </div>
              </RoleBasedComponent>
            </div>
          </CardContent>
        </Card>
        </RoleBasedComponent>
      </div>

      {/* Payroll History */}
      <RoleBasedComponent allowedRoles={['executive', 'hr_manager', 'finance']}>
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
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">Type</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs md:text-sm">Gross Pay</TableHead>
                    <TableHead className="text-xs md:text-sm">Tax</TableHead>
                    <TableHead className="text-xs md:text-sm">Net Pay</TableHead>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getVisiblePayrollRecords().map(record => <TableRow key={record.id}>
                      <TableCell className="font-medium text-xs md:text-sm">{record.employeeName}</TableCell>
                      <TableCell className="text-xs md:text-sm">{record.period}</TableCell>
                      <TableCell className="hidden md:table-cell text-xs md:text-sm">
                        <Badge variant={record.role === "contract_employee" ? "secondary" : "outline"} className="text-xs">
                          {record.role === "contract_employee" ? "Contract" : "Full-time"}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-xs md:text-sm">{formatCurrency(record.grossPay)}</TableCell>
                      <TableCell className="text-xs md:text-sm">{formatCurrency(record.paye)}</TableCell>
                      <TableCell className="font-medium text-xs md:text-sm">{formatCurrency(record.netPay)}</TableCell>
                      <TableCell>{getStatusBadge(record.status)}</TableCell>
                    </TableRow>)}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </RoleBasedComponent>
    </div>;
}