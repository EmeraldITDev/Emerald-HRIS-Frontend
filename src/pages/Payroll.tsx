import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiService, { Employee } from "@/lib/api"
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Calculator, Download, FileText, Lock, Settings, FileDown } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { RoleBasedComponent } from "@/components/RoleBasedComponent"
import { 
  generateEmployeePayslipPDF, 
  generateContractorPayslipPDF, 
  exportPayslipCSV,
  downloadFile,
  PayrollData,
  ContractorPayrollData
} from "@/utils/payslipExport"

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
    basicSalary: 0, // Contract staff don't have basic salary
    allowances: 0, // No allowances for contract staff
    grossPay: 1200000, // Only gross contract amount
    paye: 60000, // 5% Withholding Tax for contract
    pension: 0, // No pension for contract staff
    nhf: 0, // No NHF for contract staff
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
  }
]

// Fetch employees from API - defined at component level

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("2024-01")
  const [isPayrollLocked, setIsPayrollLocked] = useState(false)
  const [payrollData, setPayrollData] = useState({
    basicSalary: "1600000",
    earnings: "50000",
    earningsRemarks: "",
    deduction: "25000",
    deductionRemarks: "",
  })
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiService.getEmployees()
        setEmployees(data.filter(emp => emp.employment_status === 'Active'))
      } catch (error) {
        console.error('Failed to fetch employees:', error)
        toast({
          title: "Error",
          description: "Failed to load employees from database",
          variant: "destructive"
        })
      } finally {
        setIsLoadingEmployees(false)
      }
    }
    fetchEmployees()
  }, [])

  const onboardEmployees = employees.map(emp => ({
    id: emp.id?.toString() || '',
    name: `${emp.first_name} ${emp.last_name}`,
    basicSalary: emp.gross_salary || 0,
    pensionId: emp.pension_pin || '',
    taxId: emp.tax_id || '',
    employmentType: emp.employment_type || 'Full-time',
    status: emp.employment_status || 'Active',
    role: 'general_employee'
  }))

  // Filter payroll records based on user role
  const getVisiblePayrollRecords = () => {
    if (!user) return []
    
    // HR Manager can see all payroll records
    if (user.role === 'hr_manager') {
      return payrollRecords
    } 
    // Executives see only their department's payroll
    else if (user.role === 'executive' && user.department) {
      return payrollRecords.filter(record => record.department === user.department)
    } 
    // Other users can only see their own payroll
    else {
      return payrollRecords.filter(record => 
        record.employeeId === user.email || 
        record.employeeName.toLowerCase().includes(user.email.split('@')[0].toLowerCase())
      )
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const calculatePayroll = () => {
    const selectedEmp = onboardEmployees.find(emp => emp.id === selectedEmployee)
    const employmentType = selectedEmp?.employmentType || "Full-time"
    
    const basicSalary = parseFloat(payrollData.basicSalary) || 0
    const earnings = parseFloat(payrollData.earnings) || 0
    const deduction = parseFloat(payrollData.deduction) || 0
    
    let annualGross, housing, transport, other, pensionEmployee, pensionEmployer, nhf;
    let grossForCRA, cra, totalRelief, taxableIncome, annualTax, annualNet;
    
    if (employmentType === "Full-time") {
      // Calculate Annual Gross from Basic Salary (rounded to nearest whole number)
      // Since Basic = 40% of Annual Gross, then Annual Gross = Basic / 0.40
      annualGross = Math.round(basicSalary / 0.40)
      
      // Calculate allowances as percentages of Annual Gross (rounded to nearest whole number)
      housing = Math.round(annualGross * 0.20)     // Housing Allowance = 20% × Annual Gross
      transport = Math.round(annualGross * 0.09)   // Transport Allowance = 9% × Annual Gross
      other = Math.round(annualGross * 0.31)       // Other Allowances = 31% × Annual Gross
      
      // Pension calculations: 8% of (Housing + Transport + Basic Salary)
      pensionEmployee = (housing + transport + basicSalary) * 0.08  // Employee Pension = 8% × (Housing + Transport + Basic)
      pensionEmployer = annualGross * 0.10  // Employer Pension = 10% × Annual Gross
      
      // NHF based on Basic Salary
      nhf = basicSalary * 0.025  // NHF = 2.5% × Basic
      
      // Gross for CRA calculation
      grossForCRA = annualGross - (pensionEmployee + nhf)
      
      // CRA (Consolidated Relief Allowance)
      // Formula: 20% of Gross for CRA + MAX(1% of Gross for CRA, 200000)
      cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
      
      // Total Relief Allowances
      totalRelief = cra + pensionEmployee + nhf
      
      // Taxable Income
      taxableIncome = annualGross - totalRelief
      
      // PAYE Tax Calculation (Official Nigerian Progressive Tax Rates)
      if (taxableIncome > 3200000) {
        annualTax = 560000 + (taxableIncome - 3200000) * 0.24
      } else if (taxableIncome > 1600000) {
        annualTax = 224000 + (taxableIncome - 1600000) * 0.21
      } else if (taxableIncome > 1100000) {
        annualTax = 129000 + (taxableIncome - 1100000) * 0.19
      } else if (taxableIncome > 600000) {
        annualTax = 54000 + (taxableIncome - 600000) * 0.15
      } else if (taxableIncome > 300000) {
        annualTax = 21000 + (taxableIncome - 300000) * 0.11
      } else {
        annualTax = taxableIncome * 0.07
      }
      
      // Annual Net Pay
      annualNet = annualGross - annualTax
      
    } else {
      // Contract: Simple calculation with withholding tax
      annualGross = basicSalary  // For contracts, treat input as total contract amount
      housing = 0
      transport = 0
      other = 0
      pensionEmployee = 0
      pensionEmployer = 0
      nhf = 0
      grossForCRA = 0
      cra = 0
      totalRelief = 0
      taxableIncome = annualGross
      annualTax = annualGross * 0.05  // 5% Withholding Tax
      annualNet = annualGross - annualTax
    }
    
    // Add earnings and deductions
    const grossPay = annualGross + earnings
    const totalDeductions = annualTax + deduction
    const netPay = grossPay - totalDeductions
    
    // Employer costs
    const nsitf = employmentType === "Full-time" ? annualGross * 0.01 : 0
    const itf = employmentType === "Full-time" ? annualGross * 0.01 : 0
    const totalEmployerCost = grossPay + pensionEmployer + nsitf + itf
    
    // Monthly figures (divide annual by 12)
    const monthlyBasic = basicSalary / 12
    const monthlyHousing = housing / 12
    const monthlyTransport = transport / 12
    const monthlyOther = other / 12
    const monthlyGross = annualGross / 12
    const monthlyPensionEmployee = pensionEmployee / 12
    const monthlyPensionEmployer = pensionEmployer / 12
    const monthlyNHF = nhf / 12
    const monthlyCRA = cra / 12
    const monthlyRelief = totalRelief / 12
    const monthlyTaxableIncome = taxableIncome / 12
    const monthlyTax = annualTax / 12
    const monthlyNet = annualNet / 12
    
    return {
      // Annual values
      basicSalary,
      annualGross,
      housing,
      transport,
      other,
      pensionEmployee,
      pensionEmployer,
      nhf,
      grossForCRA,
      cra,
      totalRelief,
      taxableIncome,
      annualTax,
      annualNet,
      nsitf,
      itf,
      
      // Monthly values
      monthlyBasic,
      monthlyHousing,
      monthlyTransport,
      monthlyOther,
      monthlyGross,
      monthlyPensionEmployee,
      monthlyPensionEmployer,
      monthlyNHF,
      monthlyCRA,
      monthlyRelief,
      monthlyTaxableIncome,
      monthlyTax,
      monthlyNet,
      
      // Additional
      earnings,
      deduction,
      grossPay,
      totalDeductions,
      netPay,
      totalEmployerCost,
      employmentType,
      taxType: employmentType === "Full-time" ? "PAYE" : "Withholding Tax"
    }
  }

  const calculations = calculatePayroll()

  const handleTaxSettings = () => {
    toast({
      title: "Tax Settings",
      description: "Tax settings panel will be available in the next update."
    })
  }

  const handleExportPayslipPDF = (employeeId: string, period: string) => {
    const employee = onboardEmployees.find(emp => emp.id === employeeId)
    if (!employee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive"
      })
      return
    }

    const empData = employees.find(e => e.id?.toString() === employeeId)
    if (!empData) {
      toast({
        title: "Error",
        description: "Employee data not found",
        variant: "destructive"
      })
      return
    }

    const [year, month] = period.split('-')
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
    
    const basicSalary = employee.basicSalary / 12 // Monthly basic salary
    const isContractor = employee.employmentType !== 'Full-time'

    if (isContractor) {
      // Contract staff payslip
      const contractFee = basicSalary
      const withholdingTax = contractFee * 0.02 // 2% withholding tax
      const netPay = contractFee - withholdingTax

      const payrollData: ContractorPayrollData = {
        employee: empData,
        month: monthName,
        year: year,
        contractFee,
        withholdingTax,
        netPay
      }

      const doc = generateContractorPayslipPDF(payrollData)
      doc.save(`${empData.first_name}_${empData.last_name}_Payslip.pdf`)
    } else {
      // Regular employee payslip
      const annualGross = Math.round(basicSalary / 0.40)
      const housingAllowance = Math.round(annualGross * 0.20)
      const transportAllowance = Math.round(annualGross * 0.09)
      const otherAllowances = Math.round(annualGross * 0.31)
      
      const pension = (housingAllowance + transportAllowance + basicSalary) * 0.08
      const nhf = basicSalary * 0.025
      
      const grossForCRA = annualGross - (pension + nhf)
      const cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
      const totalRelief = cra + pension + nhf
      const taxableIncome = annualGross - totalRelief
      
      let paye = 0
      if (taxableIncome > 3200000) {
        paye = 560000 + (taxableIncome - 3200000) * 0.24
      } else if (taxableIncome > 1600000) {
        paye = 224000 + (taxableIncome - 1600000) * 0.21
      } else if (taxableIncome > 1100000) {
        paye = 129000 + (taxableIncome - 1100000) * 0.19
      } else if (taxableIncome > 600000) {
        paye = 54000 + (taxableIncome - 600000) * 0.15
      } else if (taxableIncome > 300000) {
        paye = 21000 + (taxableIncome - 300000) * 0.11
      } else {
        paye = taxableIncome * 0.07
      }
      
      const totalDeductions = paye + pension + nhf
      const netPay = annualGross - totalDeductions

      const payrollData: PayrollData = {
        employee: empData,
        month: monthName,
        year: year,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        grossSalary: annualGross,
        paye,
        pension,
        nhf,
        totalDeductions,
        netPay
      }

      const doc = generateEmployeePayslipPDF(payrollData)
      doc.save(`${empData.first_name}_${empData.last_name}_Payslip.pdf`)
    }

    toast({
      title: "Success",
      description: "Payslip downloaded successfully"
    })
  }

  const handleExportPayslipCSV = (employeeId: string, period: string) => {
    const employee = onboardEmployees.find(emp => emp.id === employeeId)
    if (!employee) {
      toast({
        title: "Error",
        description: "Employee not found",
        variant: "destructive"
      })
      return
    }

    const empData = employees.find(e => e.id?.toString() === employeeId)
    if (!empData) {
      toast({
        title: "Error",
        description: "Employee data not found",
        variant: "destructive"
      })
      return
    }

    const [year, month] = period.split('-')
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleString('default', { month: 'long' })
    
    const basicSalary = employee.basicSalary / 12
    const isContractor = employee.employmentType !== 'Full-time'

    let csvContent: string

    if (isContractor) {
      const contractFee = basicSalary
      const withholdingTax = contractFee * 0.02
      const netPay = contractFee - withholdingTax

      const payrollData: ContractorPayrollData = {
        employee: empData,
        month: monthName,
        year: year,
        contractFee,
        withholdingTax,
        netPay
      }

      csvContent = exportPayslipCSV(payrollData)
    } else {
      const annualGross = Math.round(basicSalary / 0.40)
      const housingAllowance = Math.round(annualGross * 0.20)
      const transportAllowance = Math.round(annualGross * 0.09)
      const otherAllowances = Math.round(annualGross * 0.31)
      
      const pension = (housingAllowance + transportAllowance + basicSalary) * 0.08
      const nhf = basicSalary * 0.025
      
      const grossForCRA = annualGross - (pension + nhf)
      const cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
      const totalRelief = cra + pension + nhf
      const taxableIncome = annualGross - totalRelief
      
      let paye = 0
      if (taxableIncome > 3200000) {
        paye = 560000 + (taxableIncome - 3200000) * 0.24
      } else if (taxableIncome > 1600000) {
        paye = 224000 + (taxableIncome - 1600000) * 0.21
      } else if (taxableIncome > 1100000) {
        paye = 129000 + (taxableIncome - 1100000) * 0.19
      } else if (taxableIncome > 600000) {
        paye = 54000 + (taxableIncome - 600000) * 0.15
      } else if (taxableIncome > 300000) {
        paye = 21000 + (taxableIncome - 300000) * 0.11
      } else {
        paye = taxableIncome * 0.07
      }
      
      const totalDeductions = paye + pension + nhf
      const netPay = annualGross - totalDeductions

      const payrollData: PayrollData = {
        employee: empData,
        month: monthName,
        year: year,
        basicSalary,
        housingAllowance,
        transportAllowance,
        otherAllowances,
        grossSalary: annualGross,
        paye,
        pension,
        nhf,
        totalDeductions,
        netPay
      }

      csvContent = exportPayslipCSV(payrollData)
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    downloadFile(blob, `${empData.first_name}_${empData.last_name}_Payslip.csv`)

    toast({
      title: "Success",
      description: "CSV exported successfully"
    })
  }

  const handleExportPayroll = () => {
    // Calculate comprehensive payroll data for all employees
    const exportData = onboardEmployees.map(employee => {
      // Use employee's basic salary for calculation
      const basicSalary = employee.basicSalary
      const employmentType = employee.employmentType
      
      let annualGross, housing, transport, other, pensionEmployee, pensionEmployer, nhf;
      let grossForCRA, cra, totalRelief, taxableIncome, annualTax, annualNet;
      
      if (employmentType === "Full-time") {
        // Calculate Annual Gross from Basic Salary (rounded to nearest whole number)
        annualGross = Math.round(basicSalary / 0.40)
        
        // Calculate allowances as percentages of Annual Gross (rounded to nearest whole number)
        housing = Math.round(annualGross * 0.20)
        transport = Math.round(annualGross * 0.09)
        other = Math.round(annualGross * 0.31)
        
        // Pension calculations: 8% of (Housing + Transport + Basic Salary)
        pensionEmployee = (housing + transport + basicSalary) * 0.08
        pensionEmployer = annualGross * 0.10
        
        // NHF based on Basic Salary
        nhf = basicSalary * 0.025
        
        // Gross for CRA calculation
        grossForCRA = annualGross - (pensionEmployee + nhf)
        
        // CRA (Consolidated Relief Allowance)
        // Formula: 20% of Gross for CRA + MAX(1% of Gross for CRA, 200000)
        cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
        
        // Total Relief Allowances
        totalRelief = cra + pensionEmployee + nhf
        
        // Taxable Income
        taxableIncome = annualGross - totalRelief
        
        // PAYE Tax Calculation
        annualTax = 0
        if (taxableIncome > 300000) {
          if (taxableIncome <= 600000) {
            annualTax = (taxableIncome - 300000) * 0.07
          } else if (taxableIncome <= 1100000) {
            annualTax = 21000 + (taxableIncome - 600000) * 0.11
          } else if (taxableIncome <= 1600000) {
            annualTax = 76000 + (taxableIncome - 1100000) * 0.15
          } else if (taxableIncome <= 3200000) {
            annualTax = 151000 + (taxableIncome - 1600000) * 0.19
          } else if (taxableIncome <= 3900000) {
            annualTax = 455000 + (taxableIncome - 3200000) * 0.21
          } else {
            annualTax = 602000 + (taxableIncome - 3900000) * 0.24
          }
        }
        
        // Annual Net Pay
        annualNet = annualGross - annualTax
        
      } else {
        // Contract: Simple calculation
        annualGross = basicSalary
        housing = 0
        transport = 0
        other = 0
        pensionEmployee = 0
        pensionEmployer = 0
        nhf = 0
        grossForCRA = 0
        cra = 0
        totalRelief = 0
        taxableIncome = annualGross
        annualTax = annualGross * 0.05
        annualNet = annualGross - annualTax
      }
      
      const nsitf = employmentType === "Full-time" ? annualGross * 0.01 : 0
      const itf = employmentType === "Full-time" ? annualGross * 0.01 : 0
      const totalEmployerCost = annualGross + pensionEmployer + nsitf + itf
      
      return {
        'Employee ID': employee.id,
        'Employee Name': employee.name,
        'Employment Type': employmentType,
        'Annual Basic Salary': basicSalary,
        'Annual Housing Allowance': housing,
        'Annual Transport Allowance': transport,
        'Annual Other Allowance': other,
        'Annual Gross Salary': annualGross,
        'Employee Pension (8% of Housing + Transport + Basic)': pensionEmployee,
        'NHF (2.5% of Basic)': nhf,
        'Gross for CRA': grossForCRA,
        'CRA': cra,
        'Total Relief Allowances': totalRelief,
        'Taxable Income': taxableIncome,
        'Annual PAYE/Withholding Tax': annualTax,
        'Annual Net Pay': annualNet,
        'Employer Pension (10%)': pensionEmployer,
        'NSITF': nsitf,
        'ITF': itf,
        'Total Employer Cost': totalEmployerCost,
        'Monthly Basic': basicSalary / 12,
        'Monthly Gross': annualGross / 12,
        'Monthly Tax': annualTax / 12,
        'Monthly Net': annualNet / 12
      }
    })

    // Convert to CSV
    const headers = Object.keys(exportData[0] || {})
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `comprehensive_payroll_export_${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `Comprehensive payroll data exported for ${exportData.length} employees with all salary components and deductions.`
    })
  }

  const handleExportPayrollPDF = () => {
    if (onboardEmployees.length === 0) {
      toast({
        title: "No Data",
        description: "No employees to export",
        variant: "destructive"
      })
      return
    }

    // Generate PDF payslips for all employees
    const currentDate = new Date()
    const currentMonth = currentDate.toLocaleString('default', { month: 'long' })
    const currentYear = currentDate.getFullYear().toString()

    onboardEmployees.forEach(employee => {
      const empData = employees.find(e => e.id?.toString() === employee.id)
      if (!empData) return

      const basicSalary = employee.basicSalary / 12 // Monthly basic salary
      const isContractor = employee.employmentType !== 'Full-time'

      if (isContractor) {
        // Contract staff payslip
        const contractFee = basicSalary
        const withholdingTax = contractFee * 0.02
        const netPay = contractFee - withholdingTax

        const payrollData: ContractorPayrollData = {
          employee: empData,
          month: currentMonth,
          year: currentYear,
          contractFee,
          withholdingTax,
          netPay
        }

        const doc = generateContractorPayslipPDF(payrollData)
        doc.save(`${empData.first_name}_${empData.last_name}_Payslip.pdf`)
      } else {
        // Regular employee payslip
        const annualGross = Math.round(basicSalary / 0.40)
        const housingAllowance = Math.round(annualGross * 0.20)
        const transportAllowance = Math.round(annualGross * 0.09)
        const otherAllowances = Math.round(annualGross * 0.31)
        
        const pension = (housingAllowance + transportAllowance + basicSalary) * 0.08
        const nhf = basicSalary * 0.025
        
        const grossForCRA = annualGross - (pension + nhf)
        const cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
        const totalRelief = cra + pension + nhf
        const taxableIncome = annualGross - totalRelief
        
        let paye = 0
        if (taxableIncome > 3200000) {
          paye = 560000 + (taxableIncome - 3200000) * 0.24
        } else if (taxableIncome > 1600000) {
          paye = 224000 + (taxableIncome - 1600000) * 0.21
        } else if (taxableIncome > 1100000) {
          paye = 129000 + (taxableIncome - 1100000) * 0.19
        } else if (taxableIncome > 600000) {
          paye = 54000 + (taxableIncome - 600000) * 0.15
        } else if (taxableIncome > 300000) {
          paye = 21000 + (taxableIncome - 300000) * 0.11
        } else {
          paye = taxableIncome * 0.07
        }
        
        const totalDeductions = paye + pension + nhf
        const netPay = annualGross - totalDeductions

        const payrollData: PayrollData = {
          employee: empData,
          month: currentMonth,
          year: currentYear,
          basicSalary,
          housingAllowance,
          transportAllowance,
          otherAllowances,
          grossSalary: annualGross,
          paye,
          pension,
          nhf,
          totalDeductions,
          netPay
        }

        const doc = generateEmployeePayslipPDF(payrollData)
        doc.save(`${empData.first_name}_${empData.last_name}_Payslip.pdf`)
      }
    })

    toast({
      title: "Success",
      description: `Generated ${onboardEmployees.length} payslip PDF(s)`
    })
  }

  const handleLockPeriod = () => {
    setIsPayrollLocked(!isPayrollLocked)
    toast({
      title: isPayrollLocked ? "Payroll Unlocked" : "Payroll Locked",
      description: isPayrollLocked 
        ? "Payroll period has been unlocked and can now be edited." 
        : "Payroll period has been locked and cannot be edited.",
      variant: "default"
    })
  }

  const savePayroll = () => {
    if (!selectedEmployee || !selectedPeriod) return

    const selectedEmp = employees.find(emp => emp.id?.toString() === selectedEmployee)
    if (!selectedEmp) return

    // Create payroll record
    const newPayrollRecord = {
      id: `PAY${String(payrollRecords.length + 1).padStart(3, '0')}`,
      employeeId: selectedEmployee,
      employeeName: `${selectedEmp.first_name} ${selectedEmp.last_name}`,
      department: selectedEmp.department || "Unknown",
      role: "general_employee",
      basicSalary: calculations.employmentType === "Contract" ? 0 : calculations.basicSalary,
      allowances: calculations.housing + calculations.transport + calculations.other,
      grossPay: calculations.annualGross,
      paye: calculations.annualTax,
      pension: calculations.pensionEmployee,
      nhf: calculations.nhf,
      netPay: calculations.annualNet,
      period: selectedPeriod,
      status: "Processed"
    }

    payrollRecords.push(newPayrollRecord)

    toast({
      title: "Payroll Saved",
      description: `Payroll for ${selectedEmp.first_name} ${selectedEmp.last_name} has been saved successfully.`
    })

    // Reset form
    setPayrollData({
      basicSalary: "",
      earnings: "",
      earningsRemarks: "",
      deduction: "",
      deductionRemarks: "",
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
          <RoleBasedComponent allowedRoles={['hr_manager', 'executive']}>
            <Button variant="outline" size="sm" onClick={handleTaxSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Tax Settings
            </Button>
          </RoleBasedComponent>
          <RoleBasedComponent allowedRoles={['hr_manager', 'executive', 'finance']}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export Payroll
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleExportPayroll}>
                  <FileText className="mr-2 h-4 w-4" />
                  Export as CSV
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExportPayrollPDF}>
                  <FileDown className="mr-2 h-4 w-4" />
                  Export as PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </RoleBasedComponent>
          <RoleBasedComponent allowedRoles={['hr_manager']}>
            <Button size="sm" onClick={handleLockPeriod} variant={isPayrollLocked ? "destructive" : "default"}>
              <Lock className="mr-2 h-4 w-4" />
              {isPayrollLocked ? "Unlock Payroll" : "Lock Period"}
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
                    {isLoadingEmployees ? (
                      <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                    ) : onboardEmployees.length === 0 ? (
                      <SelectItem value="none" disabled>No employees found</SelectItem>
                    ) : (
                      onboardEmployees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} - {emp.employmentType}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {selectedEmployee && (
                  <p className="text-xs text-muted-foreground">
                    Type: {onboardEmployees.find(e => e.id === selectedEmployee)?.employmentType}
                  </p>
                )}
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
                  <Label htmlFor="basicSalary" className="font-semibold">
                    {calculations.employmentType === "Contract" ? "Contract Amount (₦) *" : "Annual Basic Salary (₦) *"}
                  </Label>
                  <Input
                    id="basicSalary"
                    type="number"
                    placeholder="1,600,000"
                    value={payrollData.basicSalary}
                    onChange={(e) => setPayrollData({...payrollData, basicSalary: e.target.value})}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.employmentType === "Contract" 
                      ? "Total annual contract payment" 
                      : "Annual gross will be calculated (Basic = 40% of Annual Gross)"}
                  </p>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">Additional Earnings</h4>
                  <div>
                    <Label htmlFor="earnings">Amount (₦)</Label>
                    <Input
                      id="earnings"
                      type="number"
                      min="0"
                      placeholder="50,000"
                      value={payrollData.earnings}
                      onChange={(e) => setPayrollData({...payrollData, earnings: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="earningsRemarks">Remarks</Label>
                    <Input
                      id="earningsRemarks"
                      type="text"
                      placeholder="e.g., Overtime, Bonus"
                      value={payrollData.earningsRemarks}
                      onChange={(e) => setPayrollData({...payrollData, earningsRemarks: e.target.value})}
                    />
                  </div>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">Personal Deductions</h4>
                  <div>
                    <Label htmlFor="deduction">Amount (₦)</Label>
                    <Input
                      id="deduction"
                      type="number"
                      min="0"
                      placeholder="25,000"
                      value={payrollData.deduction}
                      onChange={(e) => setPayrollData({...payrollData, deduction: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="deductionRemarks">Remarks</Label>
                    <Input
                      id="deductionRemarks"
                      type="text"
                      placeholder="e.g., Loan Repayment, Advance"
                      value={payrollData.deductionRemarks}
                      onChange={(e) => setPayrollData({...payrollData, deductionRemarks: e.target.value})}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </RoleBasedComponent>

        {/* Payroll Breakdown */}
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg border">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Gross Pay</p>
                  <p className="text-lg font-bold text-primary">{formatCurrency(calculations.grossPay)}</p>
                  <p className="text-xs text-muted-foreground">₦{(calculations.grossPay / 12).toFixed(0)}/mo</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                  <p className="text-lg font-bold text-destructive">{formatCurrency(calculations.totalDeductions)}</p>
                  <p className="text-xs text-muted-foreground">₦{(calculations.totalDeductions / 12).toFixed(0)}/mo</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Final Net Pay</p>
                  <p className="text-lg font-bold text-success">{formatCurrency(calculations.netPay)}</p>
                  <p className="text-xs text-muted-foreground">₦{(calculations.netPay / 12).toFixed(0)}/mo</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground mb-1">Total Relief</p>
                  <p className="text-lg font-bold text-info">{formatCurrency(calculations.totalRelief)}</p>
                  <p className="text-xs text-muted-foreground">₦{(calculations.monthlyRelief).toFixed(0)}/mo</p>
                </div>
              </div>

              {/* Employment Type Badge */}
              <div className="flex items-center gap-2">
                <Badge variant={calculations.employmentType === "Contract" ? "secondary" : "default"}>
                  {calculations.employmentType} Employee
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Tax Type: {calculations.taxType}
                </span>
              </div>

              {/* Annual Breakdown */}
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-success rounded-full"></span>
                  Annual Salary Breakdown
                </h3>
                <div className="space-y-3">
                  {calculations.employmentType === "Full-time" ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span className="font-medium">Basic Salary (Entered):</span>
                        <span className="font-semibold">{formatCurrency(calculations.basicSalary)}</span>
                      </div>
                      <div className="pl-4 space-y-2 text-sm border-l-2 border-primary/20">
                        <div className="flex justify-between">
                          <span>Housing Allowance (20% of Gross):</span>
                          <span>{formatCurrency(calculations.housing)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Transport Allowance (9% of Gross):</span>
                          <span>{formatCurrency(calculations.transport)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Other Allowances (31% of Gross):</span>
                          <span>{formatCurrency(calculations.other)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t-2 pt-3 bg-primary/5 p-2 rounded">
                        <span>Annual Gross Salary:</span>
                        <span className="text-primary">{formatCurrency(calculations.annualGross)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        Monthly: ₦{(calculations.monthlyGross).toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">Annual Contract Amount:</span>
                      <span className="font-semibold">{formatCurrency(calculations.basicSalary)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Relief Allowances */}
              {calculations.employmentType === "Full-time" && (
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-info rounded-full"></span>
                    Relief Allowances & Deductions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Employee Pension (8% of Housing + Transport + Basic):</span>
                      <span>{formatCurrency(calculations.pensionEmployee)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>NHF (2.5% of Basic):</span>
                      <span>{formatCurrency(calculations.nhf)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-medium border-t pt-2">
                      <span>Gross for CRA:</span>
                      <span>{formatCurrency(calculations.grossForCRA)}</span>
                    </div>
                    <div className="flex justify-between text-sm bg-info/5 p-2 rounded">
                      <span>CRA (20% × Gross for CRA + ₦200,000):</span>
                      <span className="font-semibold">{formatCurrency(calculations.cra)}</span>
                    </div>
                    <div className="flex justify-between text-base font-bold border-t-2 pt-3">
                      <span>Total Relief Allowances:</span>
                      <span className="text-info">{formatCurrency(calculations.totalRelief)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground text-right">
                      Monthly Relief: ₦{(calculations.monthlyRelief).toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Tax Calculation */}
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  Tax Calculation ({calculations.taxType})
                </h3>
                <div className="space-y-3">
                  {calculations.employmentType === "Full-time" ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Annual Gross Salary:</span>
                        <span>{formatCurrency(calculations.annualGross)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-destructive">
                        <span>Less: Total Relief Allowances:</span>
                        <span>-{formatCurrency(calculations.totalRelief)}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium border-t pt-2 bg-warning/5 p-2 rounded">
                        <span>Taxable Income:</span>
                        <span>{formatCurrency(calculations.taxableIncome)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground pl-4 space-y-1 border-l-2 border-muted">
                        <p>• First ₦300,000: Exempt</p>
                        <p>• Next ₦300,000: 7%</p>
                        <p>• Next ₦500,000: 11%</p>
                        <p>• Next ₦500,000: 15%</p>
                        <p>• Next ₦1,600,000: 19%</p>
                        <p>• Next ₦700,000: 21%</p>
                        <p>• Above ₦3,900,000: 24%</p>
                      </div>
                      <div className="flex justify-between text-base font-bold border-t-2 pt-3 bg-destructive/5 p-2 rounded">
                        <span>Annual PAYE Tax:</span>
                        <span className="text-destructive">{formatCurrency(calculations.annualTax)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground text-right">
                        Monthly Tax: ₦{(calculations.monthlyTax).toFixed(2)}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Contract Amount:</span>
                        <span>{formatCurrency(calculations.annualGross)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Withholding Tax (5%):</span>
                        <span className="text-destructive">{formatCurrency(calculations.annualTax)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Additional Earnings & Deductions */}
              {(calculations.earnings > 0 || calculations.deduction > 0) && (
                <div className="border rounded-lg p-4 bg-card">
                  <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                    <span className="w-2 h-2 bg-warning rounded-full"></span>
                    Additional Earnings & Personal Deductions
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Annual Gross Salary:</span>
                      <span>{formatCurrency(calculations.annualGross)}</span>
                    </div>
                    {calculations.earnings > 0 && (
                      <div className="flex justify-between text-sm text-success bg-success/5 p-2 rounded">
                        <span>Add: Additional Earnings{payrollData.earningsRemarks && ` (${payrollData.earningsRemarks})`}:</span>
                        <span className="font-semibold">+{formatCurrency(calculations.earnings)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span>Gross Pay (with earnings):</span>
                      <span className="text-primary">{formatCurrency(calculations.grossPay)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-destructive mt-4 border-t pt-3">
                      <span>Annual Tax ({calculations.taxType}):</span>
                      <span>-{formatCurrency(calculations.annualTax)}</span>
                    </div>
                    {calculations.deduction > 0 && (
                      <div className="flex justify-between text-sm text-destructive bg-destructive/5 p-2 rounded">
                        <span>Less: Personal Deduction{payrollData.deductionRemarks && ` (${payrollData.deductionRemarks})`}:</span>
                        <span className="font-semibold">-{formatCurrency(calculations.deduction)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t pt-2">
                      <span>Total Deductions:</span>
                      <span className="text-destructive">{formatCurrency(calculations.totalDeductions)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Net Pay Summary */}
              <div className="border-2 border-success rounded-lg p-4 bg-success/5">
                <h3 className="font-semibold text-lg mb-3">Final Net Pay Summary</h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Annual Net Pay</p>
                    <p className="text-3xl font-bold text-success">{formatCurrency(calculations.netPay)}</p>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>Gross Pay: {formatCurrency(calculations.grossPay)}</p>
                      {calculations.earnings > 0 && (
                        <p className="text-success">Additional Earnings: +{formatCurrency(calculations.earnings)}</p>
                      )}
                      <p className="text-destructive">Tax: -{formatCurrency(calculations.annualTax)}</p>
                      {calculations.deduction > 0 && (
                        <p className="text-destructive">Personal Deductions: -{formatCurrency(calculations.deduction)}</p>
                      )}
                    </div>
                  </div>
                  <div className="border-l pl-4">
                    <p className="text-sm text-muted-foreground mb-1">Monthly Net Pay</p>
                    <p className="text-3xl font-bold text-success">₦{(calculations.netPay / 12).toFixed(2)}</p>
                    <div className="text-xs text-muted-foreground mt-2 space-y-1">
                      <p>Monthly Gross: ₦{(calculations.grossPay / 12).toFixed(2)}</p>
                      {calculations.earnings > 0 && (
                        <p className="text-success">Monthly Earnings: +₦{(calculations.earnings / 12).toFixed(2)}</p>
                      )}
                      <p className="text-destructive">Monthly Tax: -₦{(calculations.monthlyTax).toFixed(2)}</p>
                      {calculations.deduction > 0 && (
                        <p className="text-destructive">Monthly Deductions: -₦{(calculations.deduction / 12).toFixed(2)}</p>
                      )}
                    </div>
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
                  {calculations.employmentType === "Full-time" ? (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Employer Pension (10% of Gross):</span>
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
                    </>
                  ) : (
                    <div className="text-sm text-muted-foreground italic">
                      • Minimal employer costs for contract staff
                    </div>
                  )}
                  <div className="flex justify-between text-base font-bold border-t-2 pt-3">
                    <span>Total Employer Cost:</span>
                    <span className="text-primary">{formatCurrency(calculations.totalEmployerCost)}</span>
                  </div>
                </div>
              </div>

              {/* Save Payroll Button */}
              <RoleBasedComponent allowedRoles={['hr_manager', 'executive', 'finance']}>
                <div className="flex justify-end border-t pt-4">
                  <Button 
                    onClick={() => savePayroll()}
                    disabled={!selectedEmployee || !selectedPeriod || !payrollData.basicSalary}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Save Payroll & Update Employee Record
                  </Button>
                </div>
              </RoleBasedComponent>
            </div>
          </CardContent>
        </Card>
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
                    <TableHead className="text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getVisiblePayrollRecords().map((record) => (
                  <TableRow key={record.id}>
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
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPayslipPDF(record.employeeId, record.period)}
                            title="Download PDF Payslip"
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleExportPayslipCSV(record.employeeId, record.period)}
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
      </RoleBasedComponent>
    </div>
  )
}