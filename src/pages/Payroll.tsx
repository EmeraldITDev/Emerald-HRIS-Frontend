import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import apiService, { Employee, PayrollRecord } from "@/lib/api"
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
import { Pencil, Save, X } from "lucide-react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calculator, Download, FileText, Lock, Settings, ChevronDown } from "lucide-react"
import jsPDF from "jspdf"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/contexts/AuthContext"
import { RoleBasedComponent } from "@/components/RoleBasedComponent"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"


// Fetch employees from API - defined at component level

export default function Payroll() {
  const [employees, setEmployees] = useState<Employee[]>([])
  const [isLoadingEmployees, setIsLoadingEmployees] = useState(true)
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([])
  const [isLoadingPayroll, setIsLoadingPayroll] = useState(true)
  const [selectedEmployee, setSelectedEmployee] = useState("")
  const [selectedPeriod, setSelectedPeriod] = useState("2024-10")
  const [isPayrollLocked, setIsPayrollLocked] = useState(false)
  const [payrollData, setPayrollData] = useState({
    basicSalary: "1600000",
    earnings: "50000",
    earningsRemarks: "",
    deduction: "25000",
    deductionRemarks: "",
  })
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<PayrollRecord>>({})
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)
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

  // Fetch payroll records from database
  useEffect(() => {
    const fetchPayrollRecords = async () => {
      try {
        setIsLoadingPayroll(true)
        const filters: any = {}
        
        // Filter based on user role
        if (user?.role === 'general_employee' || user?.role === 'finance') {
          // Employees see only their own payroll
          const currentEmployee = employees.find(emp => emp.email === user.email)
          if (currentEmployee?.id) {
            filters.employee_id = currentEmployee.id
          }
        }
        
        const data = await apiService.getPayrollRecords(filters)
        setPayrollRecords(Array.isArray(data) ? data : [])
      } catch (error) {
        console.error('Failed to fetch payroll records:', error)
        setPayrollRecords([])
      } finally {
        setIsLoadingPayroll(false)
      }
    }

    if (employees.length > 0) {
      fetchPayrollRecords()
    }
  }, [employees, user])

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
      return payrollRecords.filter(record => 
        record.employee?.department === user.department
      )
    } 
    // Other users can only see their own payroll
    else {
      const currentEmployee = employees.find(emp => emp.email === user.email)
      return payrollRecords.filter(record => 
        record.employee_id === currentEmployee?.id
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

  const handleExportCSV = () => {
    let selectedEmp;
    
    // For non-HR Manager users, automatically use their own data
    if (user?.role !== 'hr_manager') {
      selectedEmp = onboardEmployees.find(emp => 
        emp.name.toLowerCase().includes(user?.email.split('@')[0].toLowerCase() || '')
      )
      if (!selectedEmp) {
        toast({
          title: "Employee Not Found",
          description: "Could not find your employee record.",
          variant: "destructive"
        })
        return
      }
    } else {
      // HR Manager must select an employee
      if (!selectedEmployee) {
        toast({
          title: "No Employee Selected",
          description: "Please select an employee before exporting.",
          variant: "destructive"
        })
        return
      }
      selectedEmp = onboardEmployees.find(emp => emp.id === selectedEmployee)
    }
    if (!selectedEmp) return

    // Calculate payroll for selected employee
    const basicSalary = selectedEmp.basicSalary
    const employmentType = selectedEmp.employmentType
    
    let annualGross, housing, transport, other, pensionEmployee, pensionEmployer, nhf;
    let grossForCRA, cra, totalRelief, taxableIncome, annualTax, annualNet;
    
    if (employmentType === "Full-time") {
      annualGross = Math.round(basicSalary / 0.40)
      housing = Math.round(annualGross * 0.20)
      transport = Math.round(annualGross * 0.09)
      other = Math.round(annualGross * 0.31)
      pensionEmployee = (housing + transport + basicSalary) * 0.08
      pensionEmployer = annualGross * 0.10
      nhf = basicSalary * 0.025
      grossForCRA = annualGross - (pensionEmployee + nhf)
      cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
      totalRelief = cra + pensionEmployee + nhf
      taxableIncome = annualGross - totalRelief
      
      // PAYE Tax Calculation
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
      
      annualNet = annualGross - annualTax
    } else {
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
    
    const exportData = [{
      'Employee ID': selectedEmp.id,
      'Employee Name': selectedEmp.name,
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
    }]

    // Convert to CSV
    const headers = Object.keys(exportData[0])
    const csvContent = [
      headers.join(','),
      ...exportData.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
    ].join('\n')

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    const firstName = selectedEmp.name.split(' ')[0]
    const lastName = selectedEmp.name.split(' ').slice(1).join('_')
    a.download = `${firstName}_${lastName}_Payslip.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)

    toast({
      title: "Export Complete",
      description: `Payroll data exported for ${selectedEmp.name}`
    })
  }

  const handleExportPDF = () => {
    let selectedEmp;
    
    // For non-HR Manager users, automatically use their own data
    if (user?.role !== 'hr_manager') {
      selectedEmp = onboardEmployees.find(emp => 
        emp.name.toLowerCase().includes(user?.email.split('@')[0].toLowerCase() || '')
      )
      if (!selectedEmp) {
        toast({
          title: "Employee Not Found",
          description: "Could not find your employee record.",
          variant: "destructive"
        })
        return
      }
    } else {
      // HR Manager must select an employee
      if (!selectedEmployee) {
        toast({
          title: "No Employee Selected",
          description: "Please select an employee before exporting.",
          variant: "destructive"
        })
        return
      }
      selectedEmp = onboardEmployees.find(emp => emp.id === selectedEmployee)
    }
    if (!selectedEmp) return

    // Calculate payroll for selected employee
    const basicSalary = selectedEmp.basicSalary
    const employmentType = selectedEmp.employmentType
    
    let annualGross, housing, transport, other, pensionEmployee, nhf, annualTax, annualNet;
    
    if (employmentType === "Full-time") {
      annualGross = Math.round(basicSalary / 0.40)
      housing = Math.round(annualGross * 0.20)
      transport = Math.round(annualGross * 0.09)
      other = Math.round(annualGross * 0.31)
      pensionEmployee = (housing + transport + basicSalary) * 0.08
      nhf = basicSalary * 0.025
      const grossForCRA = annualGross - (pensionEmployee + nhf)
      const cra = (grossForCRA * 0.20) + Math.max(grossForCRA * 0.01, 200000)
      const totalRelief = cra + pensionEmployee + nhf
      const taxableIncome = annualGross - totalRelief
      
      // PAYE Tax Calculation
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
      
      annualNet = annualGross - annualTax
    } else {
      annualGross = basicSalary
      housing = 0
      transport = 0
      other = 0
      pensionEmployee = 0
      nhf = 0
      annualTax = annualGross * 0.02 // 2% Withholding Tax for contractors
      annualNet = annualGross - annualTax
    }

    // Monthly values
    const monthlyGross = annualGross / 12
    const monthlyBasic = basicSalary / 12
    const monthlyHousing = housing / 12
    const monthlyTransport = transport / 12
    const monthlyOther = other / 12
    const monthlyPension = pensionEmployee / 12
    const monthlyNHF = nhf / 12
    const monthlyTax = annualTax / 12
    const monthlyNet = annualNet / 12
    const totalDeductions = monthlyTax + monthlyPension + monthlyNHF

    // Create PDF
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    
    // Company Header
    pdf.setFontSize(10)
    pdf.text("Sapetro Towers,", pageWidth / 2, 15, { align: "center" })
    pdf.setFontSize(12)
    pdf.setFont("helvetica", "bold")
    pdf.text("EMERALD", 20, 22)
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text("5th Floor Aureum Suite 1,", pageWidth / 2, 22, { align: "center" })
    pdf.text("Adeola Odeku Street,", pageWidth / 2, 27, { align: "center" })
    pdf.setFont("helvetica", "bold")
    pdf.text("INDUSTRIAL CO.", 20, 29)
    pdf.setFontSize(9)
    pdf.setFont("helvetica", "normal")
    pdf.text("Victoria Island, Lagos, Nigeria.", pageWidth / 2, 32, { align: "center" })
    pdf.text("CFZE", 20, 35)
    pdf.text("+234 123 456 7890", pageWidth / 2, 37, { align: "center" })
    pdf.text("employee@emeraldcfze.com", pageWidth / 2, 42, { align: "center" })

    // Title
    pdf.setFontSize(16)
    pdf.setFont("helvetica", "bold")
    pdf.text("PAYSLIP", pageWidth / 2, 55, { align: "center" })

    // Employee Details
    pdf.setFontSize(10)
    pdf.setFont("helvetica", "normal")
    pdf.text(`${employmentType === "Full-time" ? "Employee" : "Contractor"} Name: ${selectedEmp.name}`, 20, 70)
    const currentDate = new Date()
    const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    pdf.text(`Month and Year: ${monthYear}`, 20, 77)

    let yPos = 90

    if (employmentType === "Full-time") {
      // Full-time payslip format
      pdf.setFont("helvetica", "bold")
      pdf.text("Pay Component", 20, yPos)
      pdf.setFont("helvetica", "normal")
      
      // Table headers
      yPos += 5
      pdf.line(20, yPos, pageWidth - 20, yPos)
      yPos += 7
      pdf.text("Basic Salary (40%)", 20, yPos)
      pdf.text(`₦${monthlyBasic.toFixed(2)}`, 120, yPos)
      pdf.text("40% of Gross", 160, yPos)
      
      yPos += 7
      pdf.text("Housing Allowance (20%)", 20, yPos)
      pdf.text(`₦${monthlyHousing.toFixed(2)}`, 120, yPos)
      pdf.text("20% of Gross", 160, yPos)
      
      yPos += 7
      pdf.text("Transport Allowance (9%)", 20, yPos)
      pdf.text(`₦${monthlyTransport.toFixed(2)}`, 120, yPos)
      pdf.text("9% of Gross", 160, yPos)
      
      yPos += 7
      pdf.text("All Other Allowances (31%)", 20, yPos)
      pdf.text(`₦${monthlyOther.toFixed(2)}`, 120, yPos)
      pdf.text("31% of Gross", 160, yPos)
      
      yPos += 7
      pdf.setFont("helvetica", "bold")
      pdf.text("Gross Monthly Salary", 20, yPos)
      pdf.text(`₦${monthlyGross.toFixed(2)}`, 120, yPos)
      
      // Deductions
      yPos += 12
      pdf.text("Deductions", 20, yPos)
      pdf.setFont("helvetica", "normal")
      
      yPos += 5
      pdf.line(20, yPos, pageWidth - 20, yPos)
      yPos += 7
      pdf.text("PAYE", 20, yPos)
      pdf.text(`₦${monthlyTax.toFixed(2)}`, 120, yPos)
      pdf.text("Statutory tax", 160, yPos)
      
      yPos += 7
      pdf.text("Pension (Employee)", 20, yPos)
      pdf.text(`₦${monthlyPension.toFixed(2)}`, 120, yPos)
      pdf.text("8% of BHT", 160, yPos)
      
      yPos += 7
      pdf.text("NHF (2.5%)", 20, yPos)
      pdf.text(`₦${monthlyNHF.toFixed(2)}`, 120, yPos)
      pdf.text("2.5% of Basic Salary", 160, yPos)
      
      yPos += 7
      pdf.setFont("helvetica", "bold")
      pdf.text("Total Deductions", 20, yPos)
      pdf.text(`₦${totalDeductions.toFixed(2)}`, 120, yPos)
      
      yPos += 7
      pdf.text("Net Monthly Pay", 20, yPos)
      pdf.text(`₦${monthlyNet.toFixed(2)}`, 120, yPos)
    } else {
      // Contractor payslip format
      pdf.setFont("helvetica", "bold")
      pdf.text("Pay Component", 20, yPos)
      pdf.setFont("helvetica", "normal")
      
      yPos += 5
      pdf.line(20, yPos, pageWidth - 20, yPos)
      yPos += 7
      pdf.text("Contract Fee (Gross)", 20, yPos)
      pdf.text(`₦${monthlyGross.toFixed(2)}`, 120, yPos)
      
      // Deductions
      yPos += 12
      pdf.setFont("helvetica", "bold")
      pdf.text("Deductions", 20, yPos)
      pdf.setFont("helvetica", "normal")
      
      yPos += 5
      pdf.line(20, yPos, pageWidth - 20, yPos)
      yPos += 7
      pdf.text("Withholding Tax (2%)", 20, yPos)
      pdf.text(`₦${monthlyTax.toFixed(2)}`, 120, yPos)
      
      yPos += 7
      pdf.setFont("helvetica", "bold")
      pdf.text("Total Deductions", 20, yPos)
      pdf.text(`₦${monthlyTax.toFixed(2)}`, 120, yPos)
      
      yPos += 7
      pdf.text("Net Pay", 20, yPos)
      pdf.text(`₦${monthlyNet.toFixed(2)}`, 120, yPos)
      pdf.text("Gross minus deduction", 160, yPos)
    }

    // Signature
    yPos += 15
    pdf.setFont("helvetica", "normal")
    pdf.setFontSize(9)
    pdf.text("Signature:", 20, yPos)
    yPos += 10
    pdf.text("Human Resource Department", 20, yPos)

    // Save PDF
    const firstName = selectedEmp.name.split(' ')[0]
    const lastName = selectedEmp.name.split(' ').slice(1).join('_')
    pdf.save(`${firstName}_${lastName}_Payslip.pdf`)

    toast({
      title: "PDF Export Complete",
      description: `Payslip generated for ${selectedEmp.name}`
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
    const newPayrollRecord: PayrollRecord = {
      employee_id: parseInt(selectedEmployee),
      pay_period: selectedPeriod,
      basic_salary: calculations.employmentType === "Contract" ? 0 : calculations.basicSalary,
      housing_allowance: calculations.housing,
      transport_allowance: calculations.transport,
      meal_allowance: 0,
      other_allowance: calculations.other,
      overtime: 0,
      bonus: 0,
      commission: 0,
      gross_pay: calculations.annualGross,
      total_allowances: calculations.housing + calculations.transport + calculations.other,
      taxable_income: calculations.annualGross,
      paye_tax: calculations.annualTax,
      pension_employee: calculations.pensionEmployee,
      pension_employer: calculations.pensionEmployer,
      nhf: calculations.nhf,
      other_deductions: 0,
      total_deductions: calculations.annualTax + calculations.pensionEmployee + calculations.nhf,
      net_pay: calculations.annualNet,
      status: "processed"
    }

    payrollRecords.push(newPayrollRecord as any)

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
    switch (status.toLowerCase()) {
      case "paid":
        return <Badge className="bg-success/10 text-success border-success/20 text-xs">Paid</Badge>
      case "processed":
        return <Badge className="bg-info/10 text-info border-info/20 text-xs">Processed</Badge>
      case "pending":
        return <Badge className="bg-warning/10 text-warning border-warning/20 text-xs">Pending</Badge>
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-xs">Cancelled</Badge>
      default:
        return <Badge variant="secondary" className="text-xs">{status}</Badge>
    }
  }

  const startEditing = (record: PayrollRecord) => {
    setSelectedRecord(record)
    setEditingValues({
      basic_salary: record.basic_salary,
      housing_allowance: record.housing_allowance,
      transport_allowance: record.transport_allowance,
      meal_allowance: record.meal_allowance,
      other_allowance: record.other_allowance,
      overtime: record.overtime,
      bonus: record.bonus,
      commission: record.commission,
      other_deductions: record.other_deductions,
    })
    setShowEditDialog(true)
  }

  const cancelEditing = () => {
    setShowEditDialog(false)
    setSelectedRecord(null)
    setEditingValues({})
  }

  const savePayrollUpdate = async () => {
    if (!selectedRecord?.id) return
    
    try {
      // Update payroll record in database with all fields
      await apiService.updatePayroll(selectedRecord.id, {
        basic_salary: editingValues.basic_salary || 0,
        housing_allowance: editingValues.housing_allowance || 0,
        transport_allowance: editingValues.transport_allowance || 0,
        meal_allowance: editingValues.meal_allowance || 0,
        other_allowance: editingValues.other_allowance || 0,
        overtime: editingValues.overtime || 0,
        bonus: editingValues.bonus || 0,
        commission: editingValues.commission || 0,
        other_deductions: editingValues.other_deductions || 0,
      })

      // Refresh payroll records
      const filters: any = {}
      if (user?.role === 'general_employee' || user?.role === 'finance') {
        const currentEmployee = employees.find(emp => emp.email === user.email)
        if (currentEmployee?.id) {
          filters.employee_id = currentEmployee.id
        }
      }
      const data = await apiService.getPayrollRecords(filters)
      setPayrollRecords(Array.isArray(data) ? data : [])

      toast({
        title: "Payroll Updated",
        description: "Payroll record has been updated successfully."
      })

      cancelEditing()
    } catch (error) {
      console.error('Failed to update payroll:', error)
      toast({
        title: "Update Failed",
        description: "Failed to update payroll record.",
        variant: "destructive"
      })
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                Export Payroll
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border shadow-lg">
              <DropdownMenuItem onClick={handleExportPDF}>
                Export as PDF
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV}>
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <RoleBasedComponent allowedRoles={['hr_manager']}>
            <Button size="sm" onClick={handleLockPeriod} variant={isPayrollLocked ? "destructive" : "default"}>
              <Lock className="mr-2 h-4 w-4" />
              {isPayrollLocked ? "Unlock Period" : "Lock Period"}
            </Button>
          </RoleBasedComponent>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Payroll Calculator - For HR Manager only */}
        <RoleBasedComponent allowedRoles={['hr_manager']}>
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

            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      <RoleBasedComponent allowedRoles={['hr_manager']}>
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary">Payroll History - Edit & Update</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">Click edit to modify payroll records. Changes sync to employee records.</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs md:text-sm">Employee</TableHead>
                    <TableHead className="text-xs md:text-sm">Period</TableHead>
                    <TableHead className="hidden md:table-cell text-xs md:text-sm">Basic Salary</TableHead>
                    <TableHead className="hidden lg:table-cell text-xs md:text-sm">Bonus</TableHead>
                    <TableHead className="text-xs md:text-sm">Gross Pay</TableHead>
                    <TableHead className="text-xs md:text-sm">Net Pay</TableHead>
                    <TableHead className="text-xs md:text-sm">Status</TableHead>
                    <TableHead className="text-xs md:text-sm">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPayroll ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                          <span>Loading payroll records...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : getVisiblePayrollRecords().length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-12">
                        <div className="flex flex-col items-center space-y-3">
                          <div className="text-5xl text-muted-foreground/20">📊</div>
                          <div className="space-y-1">
                            <p className="font-medium text-muted-foreground">No Payroll Records Available</p>
                            <p className="text-sm text-muted-foreground/70">
                              {user?.role === 'general_employee' || user?.role === 'finance' 
                                ? "Your payroll information will appear here once it's been processed by HR."
                                : "No payroll records found for the selected period. Generate payroll to get started."}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    getVisiblePayrollRecords().map((record) => (
                      <TableRow key={record.id}>
                        <TableCell className="font-medium text-xs md:text-sm">
                          {record.employee ? `${record.employee.first_name} ${record.employee.last_name}` : '-'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">{record.pay_period || '-'}</TableCell>
                        <TableCell className="hidden md:table-cell text-xs md:text-sm">
                          {record.basic_salary ? formatCurrency(record.basic_salary) : '-'}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-xs md:text-sm">
                          {record.bonus ? formatCurrency(record.bonus) : '-'}
                        </TableCell>
                        <TableCell className="text-xs md:text-sm">
                          {record.gross_pay ? formatCurrency(record.gross_pay) : '-'}
                        </TableCell>
                        <TableCell className="font-medium text-xs md:text-sm">
                          {record.net_pay ? formatCurrency(record.net_pay) : '-'}
                        </TableCell>
                        <TableCell>{getStatusBadge(record.status || 'pending')}</TableCell>
                        <TableCell>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="h-7 px-2"
                            onClick={() => startEditing(record)}
                          >
                            <Pencil className="h-3 w-3 mr-1" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </RoleBasedComponent>

      {/* Edit Payroll Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Payroll Record</DialogTitle>
            <DialogDescription>
              Update salary components and earnings for {selectedRecord?.employee ? `${selectedRecord.employee.first_name} ${selectedRecord.employee.last_name}` : 'employee'} - {selectedRecord?.pay_period}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            {/* Salary Components */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Salary Components</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">Basic Salary</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="basic_salary"
                      type="number"
                      value={editingValues.basic_salary || 0}
                      onChange={(e) => setEditingValues({...editingValues, basic_salary: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="housing_allowance">Housing Allowance</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="housing_allowance"
                      type="number"
                      value={editingValues.housing_allowance || 0}
                      onChange={(e) => setEditingValues({...editingValues, housing_allowance: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transport_allowance">Transport Allowance</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="transport_allowance"
                      type="number"
                      value={editingValues.transport_allowance || 0}
                      onChange={(e) => setEditingValues({...editingValues, transport_allowance: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="meal_allowance">Meal Allowance</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="meal_allowance"
                      type="number"
                      value={editingValues.meal_allowance || 0}
                      onChange={(e) => setEditingValues({...editingValues, meal_allowance: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="other_allowance">Other Allowance</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="other_allowance"
                      type="number"
                      value={editingValues.other_allowance || 0}
                      onChange={(e) => setEditingValues({...editingValues, other_allowance: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Earnings */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Additional Earnings</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="overtime">Overtime</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="overtime"
                      type="number"
                      value={editingValues.overtime || 0}
                      onChange={(e) => setEditingValues({...editingValues, overtime: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bonus">Bonus</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="bonus"
                      type="number"
                      value={editingValues.bonus || 0}
                      onChange={(e) => setEditingValues({...editingValues, bonus: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="commission">Commission</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="commission"
                      type="number"
                      value={editingValues.commission || 0}
                      onChange={(e) => setEditingValues({...editingValues, commission: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Deductions */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Deductions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="other_deductions">Other Deductions</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="other_deductions"
                      type="number"
                      value={editingValues.other_deductions || 0}
                      onChange={(e) => setEditingValues({...editingValues, other_deductions: Number(e.target.value)})}
                      className="pl-8"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold text-sm">Current Values</h3>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>Gross Pay: <span className="font-medium">{selectedRecord?.gross_pay ? formatCurrency(selectedRecord.gross_pay) : '-'}</span></div>
                <div>Net Pay: <span className="font-medium">{selectedRecord?.net_pay ? formatCurrency(selectedRecord.net_pay) : '-'}</span></div>
                <div>PAYE Tax: <span className="font-medium">{selectedRecord?.paye_tax ? formatCurrency(selectedRecord.paye_tax) : '-'}</span></div>
                <div>Pension: <span className="font-medium">{selectedRecord?.pension_employee ? formatCurrency(selectedRecord.pension_employee) : '-'}</span></div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={cancelEditing}>
              Cancel
            </Button>
            <Button onClick={savePayrollUpdate}>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}