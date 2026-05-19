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
import { Pencil, Save, X, Trash2 } from "lucide-react"
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
import { canHrPayroll } from "@/lib/permissions"
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
  const [selectedPeriod, setSelectedPeriod] = useState(new Date().toISOString().slice(0, 7))
  const [allowedPeriods, setAllowedPeriods] = useState<Array<{ value: string; label: string; is_current: boolean }>>([])
  const [isPayrollLocked, setIsPayrollLocked] = useState(false)
  const [payrollData, setPayrollData] = useState({
    basicSalary: "",
    earnings: "",
    earningsRemarks: "",
    deduction: "",
    deductionRemarks: "",
  })
  const [editingRecordId, setEditingRecordId] = useState<number | null>(null)
  const [editingValues, setEditingValues] = useState<Partial<PayrollRecord>>({})
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<PayrollRecord | null>(null)
  const { toast } = useToast()
  const { user } = useAuth()

  const toMoneyNumber = (value: unknown) => {
    if (value === null || value === undefined || value === '') return 0
    const normalized = typeof value === 'string' ? value.replace(/[₦,\s]/g, '') : value
    const parsed = Number(normalized)
    return Number.isFinite(parsed) ? parsed : 0
  }

  const roundMoney = (value: number) => Math.round(value * 100) / 100

  const calculateAnnualPaye = (annualGross: number, annualPension: number, annualNhf: number) => {
    const grossForCra = Math.max(annualGross - annualPension - annualNhf, 0)
    const cra = grossForCra * 0.2 + Math.max(grossForCra * 0.01, 200000)
    const taxableIncome = Math.max(annualGross - cra - annualPension - annualNhf, 0)
    const bands = [
      [300000, 0.07],
      [300000, 0.11],
      [500000, 0.15],
      [500000, 0.19],
      [1600000, 0.21],
      [Infinity, 0.24],
    ] as const
    let remaining = taxableIncome
    let annualTax = 0
    for (const [band, rate] of bands) {
      if (remaining <= 0) break
      const taxableAtRate = Math.min(remaining, band)
      annualTax += taxableAtRate * rate
      remaining -= taxableAtRate
    }
    return { annualTax, taxableIncome }
  }

  const getEmployeePayrollPackage = (employee?: Employee | null) => {
    const employmentType = (employee?.employment_type || '').toLowerCase()
    const isContract = employmentType === 'contract'
    const annualGrossFromProfile = toMoneyNumber(employee?.gross_salary ?? employee?.baseSalary)
    let annualBasic = toMoneyNumber(employee?.basic_salary)
    let annualHousing = toMoneyNumber(employee?.housing_allowance)
    let annualTransport = toMoneyNumber(employee?.transport_allowance)
    let annualMeal = toMoneyNumber(employee?.meal_allowance)
    let annualOther = toMoneyNumber(employee?.other_allowance)

    if (annualGrossFromProfile > 0) {
      if (isContract) {
        annualBasic = annualBasic || annualGrossFromProfile
        annualHousing = annualTransport = annualMeal = annualOther = 0
      } else {
        annualBasic = annualBasic || annualGrossFromProfile * 0.4
        annualHousing = annualHousing || annualGrossFromProfile * 0.2
        annualTransport = annualTransport || annualGrossFromProfile * 0.09
        annualOther = annualOther || annualGrossFromProfile * 0.31
      }
    }

    const annualAllowances = annualHousing + annualTransport + annualMeal + annualOther
    const annualGross = annualGrossFromProfile || annualBasic + annualAllowances
    const annualPension = isContract ? 0 : (annualBasic + annualHousing + annualTransport) * 0.08
    const annualNhf = isContract ? 0 : annualBasic * 0.025
    const { annualTax, taxableIncome } = isContract
      ? { annualTax: annualGross * 0.05, taxableIncome: annualGross }
      : calculateAnnualPaye(annualGross, annualPension, annualNhf)

    return {
      annualGross: roundMoney(annualGross),
      annualBasic: roundMoney(annualBasic),
      annualHousing: roundMoney(annualHousing),
      annualTransport: roundMoney(annualTransport),
      annualMeal: roundMoney(annualMeal),
      annualOther: roundMoney(annualOther),
      annualPension: roundMoney(annualPension),
      annualNhf: roundMoney(annualNhf),
      annualTax: roundMoney(annualTax),
      annualTaxableIncome: roundMoney(taxableIncome),
      monthlyBasic: roundMoney(annualBasic / 12),
      monthlyHousing: roundMoney(annualHousing / 12),
      monthlyTransport: roundMoney(annualTransport / 12),
      monthlyMeal: roundMoney(annualMeal / 12),
      monthlyOther: roundMoney(annualOther / 12),
      monthlyGross: roundMoney(annualGross / 12),
      monthlyPension: roundMoney(annualPension / 12),
      monthlyNhf: roundMoney(annualNhf / 12),
      monthlyPaye: roundMoney(annualTax / 12),
    }
  }

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const data = await apiService.getEmployees()
        // Show all employees regardless of status for payroll generation
        setEmployees(data)
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

  // Fetch allowed pay periods
  useEffect(() => {
    const fetchAllowed = async () => {
      try {
        const res = await apiService.getAllowedPayPeriods()
        if (res?.periods?.length) {
          setAllowedPeriods(res.periods)
          setSelectedPeriod(res.current_month)
        }
      } catch (e) {
        // Backend may not have endpoint yet — fall back to last 12 months
        const fallback: Array<{ value: string; label: string; is_current: boolean }> = []
        const now = new Date()
        for (let i = 0; i < 24; i++) {
          const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          fallback.push({ value, label, is_current: i === 0 })
        }
        setAllowedPeriods(fallback)
      }
    }
    fetchAllowed()
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

  // Auto-populate salary when employee is selected
  useEffect(() => {
    if (selectedEmployee && employees.length > 0) {
      const selectedEmp = employees.find(emp => emp.id?.toString() === selectedEmployee)
      if (selectedEmp) {
        const payrollPackage = getEmployeePayrollPackage(selectedEmp)
        setPayrollData(prev => ({
          ...prev,
          basicSalary: payrollPackage.annualBasic ? payrollPackage.annualBasic.toString() : ""
        }))
      }
    }
  }, [selectedEmployee, employees])

  const onboardEmployees = employees.map(emp => ({
    id: emp.id?.toString() || '',
    name: `${emp.first_name} ${emp.last_name}`,
    basicSalary: getEmployeePayrollPackage(emp).annualBasic,
    pensionId: emp.pension_pin || '',
    taxId: emp.tax_id || '',
    employmentType: emp.employment_type || 'Full-time',
    status: emp.employment_status || 'Active',
    role: 'general_employee'
  }))

  // Filter payroll records based on user role
  const getVisiblePayrollRecords = () => {
    if (!user) return []
    
    // HR admins (any signal) can see all payroll records
    if (canHrPayroll(user)) {
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
        record.employee_id?.toString() === currentEmployee?.id?.toString()
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
  
  // Calculate payroll from financial details (for preview when no payroll record exists)
  const calculatePayrollFromFinancialDetails = (employee: Employee): PayrollRecord | null => {
    if (!employee) return null
    const payrollPackage = getEmployeePayrollPackage(employee)
    if (payrollPackage.annualGross === 0) return null
    const totalAllowances = payrollPackage.monthlyHousing + payrollPackage.monthlyTransport + payrollPackage.monthlyMeal + payrollPackage.monthlyOther
    const totalDeductions = payrollPackage.monthlyPaye + payrollPackage.monthlyPension + payrollPackage.monthlyNhf
    const netPay = payrollPackage.monthlyGross - totalDeductions
    
    // Return a preview payroll record
    return {
      employee_id: employee.id || 0,
      pay_period: new Date().toISOString().slice(0, 7), // Current month
      basic_salary: payrollPackage.monthlyBasic,
      housing_allowance: payrollPackage.monthlyHousing,
      transport_allowance: payrollPackage.monthlyTransport,
      meal_allowance: payrollPackage.monthlyMeal,
      other_allowance: payrollPackage.monthlyOther,
      overtime: 0,
      bonus: 0,
      commission: 0,
      gross_pay: payrollPackage.monthlyGross,
      total_allowances: totalAllowances,
      taxable_income: roundMoney(payrollPackage.annualTaxableIncome / 12),
      paye_tax: payrollPackage.monthlyPaye,
      pension_employee: payrollPackage.monthlyPension,
      pension_employer: 0,
      nhf: payrollPackage.monthlyNhf,
      other_deductions: 0,
      total_deductions: totalDeductions,
      net_pay: roundMoney(netPay),
      status: 'pending' as const,
    }
  }

  const normalizePayrollRecord = (record: PayrollRecord): PayrollRecord => {
    const employee = employees.find(emp => emp.id?.toString() === record.employee_id?.toString()) || record.employee
    const payrollPackage = getEmployeePayrollPackage(employee)
    if (!employee || payrollPackage.annualGross === 0) return record

    const overtime = toMoneyNumber(record.overtime)
    const bonus = toMoneyNumber(record.bonus)
    const commission = toMoneyNumber(record.commission)
    const otherDeductions = toMoneyNumber(record.other_deductions)
    const grossPay = payrollPackage.monthlyGross + overtime + bonus + commission
    const totalAllowances = payrollPackage.monthlyHousing + payrollPackage.monthlyTransport + payrollPackage.monthlyMeal + payrollPackage.monthlyOther
    const totalDeductions = payrollPackage.monthlyPaye + payrollPackage.monthlyPension + payrollPackage.monthlyNhf + otherDeductions

    return {
      ...record,
      basic_salary: payrollPackage.monthlyBasic,
      housing_allowance: payrollPackage.monthlyHousing,
      transport_allowance: payrollPackage.monthlyTransport,
      meal_allowance: payrollPackage.monthlyMeal,
      other_allowance: payrollPackage.monthlyOther,
      total_allowances: roundMoney(totalAllowances),
      taxable_income: roundMoney(payrollPackage.annualTaxableIncome / 12),
      paye_tax: payrollPackage.monthlyPaye,
      pension_employee: payrollPackage.monthlyPension,
      nhf: payrollPackage.monthlyNhf,
      gross_pay: roundMoney(grossPay),
      total_deductions: roundMoney(totalDeductions),
      net_pay: roundMoney(grossPay - totalDeductions),
    }
  }

  // Get current user's latest payroll record for display
  const getCurrentUserPayrollRecord = () => {
    if (!user) return null
    
    // For general employees, get their own latest record
    if (user.role === 'general_employee' || user.role === 'finance') {
      const currentEmployee = employees.find(emp => emp.email === user.email)
      if (!currentEmployee) return null
      
      // Get the most recent payroll record for this employee
      const userRecords = payrollRecords.filter(record => record.employee_id === currentEmployee.id)
      
      // If there's a payroll record, return it
      if (userRecords.length > 0) {
        // Sort by pay_period descending and get the latest
        return userRecords.sort((a, b) => {
          const dateA = new Date(a.pay_period || '')
          const dateB = new Date(b.pay_period || '')
          return dateB.getTime() - dateA.getTime()
        })[0]
      }
      
      // If no payroll record exists, calculate from financial details
      return calculatePayrollFromFinancialDetails(currentEmployee)
    }
    
    return null
  }
  
  const rawCurrentPayrollRecord = getCurrentUserPayrollRecord()
  const currentPayrollRecord = rawCurrentPayrollRecord
    ? normalizePayrollRecord(rawCurrentPayrollRecord as PayrollRecord)
    : null
  const visiblePayrollRecords = getVisiblePayrollRecords().map(normalizePayrollRecord)
  const isPreviewFromFinancialDetails = currentPayrollRecord && !payrollRecords.some(record => 
    record.employee_id === currentPayrollRecord.employee_id && 
    record.pay_period === currentPayrollRecord.pay_period
  )

  const handleTaxSettings = () => {
    toast({
      title: "Tax Settings",
      description: "Tax settings panel will be available in the next update."
    })
  }

  const handleExportCSV = () => {
    let selectedEmp;
    
    // For non-HR-admin users, automatically use their own data
    if (!canHrPayroll(user)) {
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
    
    // For non-HR-admin users, automatically use their own data
    if (!canHrPayroll(user)) {
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

  const savePayroll = async () => {
    if (!selectedEmployee || !selectedPeriod) {
      toast({
        title: "Missing Information",
        description: "Please select an employee and pay period.",
        variant: "destructive"
      })
      return
    }

    // Requirement 4: Only Corporate HR or HR admins may generate payroll
    if (!canHrPayroll(user) && user?.role !== 'corporate_hr') {
      toast({
        title: "Insufficient Permissions",
        description: "Only Corporate HR or HR Manager can generate payroll.",
        variant: "destructive"
      })
      return
    }

    const selectedEmp = employees.find(emp => emp.id?.toString() === selectedEmployee)
    if (!selectedEmp) return

    try {
      console.log('💰 Generating payroll for employee:', selectedEmployee);
      console.log('💰 Pay period:', selectedPeriod);

      const payrollPackage = getEmployeePayrollPackage(selectedEmp)
      const manualAnnualBasic = toMoneyNumber(payrollData.basicSalary)
      const basicSalary = manualAnnualBasic > 0
        ? roundMoney(manualAnnualBasic / 12)
        : payrollPackage.monthlyBasic
      const annualGross = manualAnnualBasic > 0
        ? roundMoney(manualAnnualBasic / 0.4)
        : payrollPackage.annualGross
      const monthlyGross = manualAnnualBasic > 0
        ? roundMoney(annualGross / 12)
        : payrollPackage.monthlyGross
      const overtime = toMoneyNumber(payrollData.earnings)
      const otherDeductions = toMoneyNumber(payrollData.deduction)
      const grossPay = roundMoney(monthlyGross + overtime)
      const totalAllowances = roundMoney(payrollPackage.monthlyHousing + payrollPackage.monthlyTransport + payrollPackage.monthlyMeal + payrollPackage.monthlyOther)
      const totalDeductions = roundMoney(payrollPackage.monthlyPaye + payrollPackage.monthlyPension + payrollPackage.monthlyNhf + otherDeductions)
      const netPay = roundMoney(grossPay - totalDeductions)

      console.log('💰 Employee financials:', {
        basic_salary: basicSalary,
        housing_allowance: payrollPackage.monthlyHousing,
        transport_allowance: payrollPackage.monthlyTransport,
        meal_allowance: payrollPackage.monthlyMeal,
        other_allowance: payrollPackage.monthlyOther,
        gross_pay: grossPay,
        total_deductions: totalDeductions,
        net_pay: netPay,
      })

      // Generate payroll record via backend API – pass employee-specific
      // earnings so each staff member's payroll reflects their own package.
      await apiService.generatePayroll({
        employee_id: parseInt(selectedEmployee),
        pay_period: selectedPeriod,
        basic_salary: basicSalary,
        base_salary: basicSalary,
        gross_salary: annualGross,
        housing_allowance: payrollPackage.monthlyHousing,
        transport_allowance: payrollPackage.monthlyTransport,
        meal_allowance: payrollPackage.monthlyMeal,
        other_allowance: payrollPackage.monthlyOther,
        overtime,
        other_deductions: otherDeductions,
        gross_pay: grossPay,
        total_allowances: totalAllowances,
        taxable_income: roundMoney(payrollPackage.annualTaxableIncome / 12),
        paye_tax: payrollPackage.monthlyPaye,
        income_tax: payrollPackage.monthlyPaye,
        pension_employee: payrollPackage.monthlyPension,
        pension_employer: roundMoney((annualGross * 0.1) / 12),
        nhf: payrollPackage.monthlyNhf,
        total_deductions: totalDeductions,
        net_pay: netPay,
      })

      // Refresh payroll records to show the new one
      const filters: any = {}
      const role = (user?.role as string) || ''
      if (role === 'general_employee' || role === 'finance') {
        const currentEmployee = employees.find(emp => emp.email === user.email)
        if (currentEmployee?.id) {
          filters.employee_id = currentEmployee.id
        }
      }
      const data = await apiService.getPayrollRecords(filters)
      setPayrollRecords(Array.isArray(data) ? data : [])

      toast({
        title: "Payroll Generated",
        description: `Payroll for ${selectedEmp.first_name} ${selectedEmp.last_name} has been generated successfully.`
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
    } catch (error: any) {
      console.error('Failed to generate payroll:', error)
      const errorMessage = error?.message || 'Failed to generate payroll record.'
      const alreadyExists = /already exists|duplicate|exists for this period/i.test(errorMessage)

      if (alreadyExists) {
        const filters: any = {}
        const role = (user?.role as string) || ''
        if (role === 'general_employee' || role === 'finance') {
          const currentEmployee = employees.find(emp => emp.email === user.email)
          if (currentEmployee?.id) filters.employee_id = currentEmployee.id
        }
        try {
          const data = await apiService.getPayrollRecords(filters)
          setPayrollRecords(Array.isArray(data) ? data : [])
        } catch (refreshError) {
          console.error('Failed to refresh payroll records after duplicate response:', refreshError)
        }
      }

      toast({
        title: alreadyExists ? "Payroll Already Exists" : "Generation Failed",
        description: alreadyExists
          ? `Payroll for ${selectedEmp.first_name} ${selectedEmp.last_name} in ${selectedPeriod} already exists, so I reloaded the history records.`
          : errorMessage,
        variant: "destructive"
      })
    }
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
      const basicSalary = toMoneyNumber(editingValues.basic_salary)
      const housingAllowance = toMoneyNumber(editingValues.housing_allowance)
      const transportAllowance = toMoneyNumber(editingValues.transport_allowance)
      const mealAllowance = toMoneyNumber(editingValues.meal_allowance)
      const otherAllowance = toMoneyNumber(editingValues.other_allowance)
      const overtime = toMoneyNumber(editingValues.overtime)
      const bonus = toMoneyNumber(editingValues.bonus)
      const commission = toMoneyNumber(editingValues.commission)
      const otherDeductions = toMoneyNumber(editingValues.other_deductions)
      const annualGross = (basicSalary + housingAllowance + transportAllowance + mealAllowance + otherAllowance) * 12
      const annualPension = (basicSalary + housingAllowance + transportAllowance) * 12 * 0.08
      const annualNhf = basicSalary * 12 * 0.025
      const { annualTax, taxableIncome } = calculateAnnualPaye(annualGross, annualPension, annualNhf)
      const payeTax = roundMoney(annualTax / 12)
      const pensionEmployee = roundMoney(annualPension / 12)
      const nhf = roundMoney(annualNhf / 12)
      const grossPay = roundMoney(basicSalary + housingAllowance + transportAllowance + mealAllowance + otherAllowance + overtime + bonus + commission)
      const totalDeductions = roundMoney(payeTax + pensionEmployee + nhf + otherDeductions)

      const updateData = {
        basic_salary: editingValues.basic_salary || 0,
        housing_allowance: editingValues.housing_allowance || 0,
        transport_allowance: editingValues.transport_allowance || 0,
        meal_allowance: editingValues.meal_allowance || 0,
        other_allowance: editingValues.other_allowance || 0,
        overtime: editingValues.overtime || 0,
        bonus: editingValues.bonus || 0,
        commission: editingValues.commission || 0,
        other_deductions: editingValues.other_deductions || 0,
        gross_pay: grossPay,
        total_allowances: roundMoney(housingAllowance + transportAllowance + mealAllowance + otherAllowance),
        taxable_income: roundMoney(taxableIncome / 12),
        paye_tax: payeTax,
        income_tax: payeTax,
        pension_employee: pensionEmployee,
        nhf,
        total_deductions: totalDeductions,
        net_pay: roundMoney(grossPay - totalDeductions),
      };
      
      console.log('💰 Updating payroll record:', selectedRecord.id);
      console.log('💰 Update data:', updateData);
      
      // Update payroll record in database with all fields
      const response = await apiService.updatePayroll(selectedRecord.id, updateData);
      console.log('💰 Update response:', response);

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
          {(canHrPayroll(user) || user?.role === 'executive') && (
            <Button variant="outline" size="sm" onClick={handleTaxSettings}>
              <Settings className="mr-2 h-4 w-4" />
              Tax Settings
            </Button>
          )}
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
          {canHrPayroll(user) && (
            <Button size="sm" onClick={handleLockPeriod} variant={isPayrollLocked ? "destructive" : "default"}>
              <Lock className="mr-2 h-4 w-4" />
              {isPayrollLocked ? "Unlock Period" : "Lock Period"}
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Payroll Calculator - For HR admins only */}
        {canHrPayroll(user) && (
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
                    {allowedPeriods.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        {p.label}{p.is_current ? ' (current)' : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3 border-t pt-3">
                <div>
                  <Label htmlFor="basicSalary" className="font-semibold">
                    {calculations.employmentType === "Contract" ? "Contract Amount *" : "Annual Basic Salary *"}
                  </Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                    <Input
                      id="basicSalary"
                      type="number"
                      placeholder="1,600,000"
                      value={payrollData.basicSalary}
                      onChange={(e) => setPayrollData({...payrollData, basicSalary: e.target.value})}
                      className="pl-8"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {calculations.employmentType === "Contract" 
                      ? "Total annual contract payment" 
                      : "Annual gross will be calculated (Basic = 40% of Annual Gross)"}
                  </p>
                </div>

                <div className="border rounded-lg p-3 bg-muted/30 space-y-3">
                  <h4 className="text-sm font-semibold">Additional Earnings</h4>
                  <div>
                    <Label htmlFor="earnings">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                      <Input
                        id="earnings"
                        type="number"
                        min="0"
                        placeholder="50,000"
                        value={payrollData.earnings}
                        onChange={(e) => setPayrollData({...payrollData, earnings: e.target.value})}
                        className="pl-8"
                      />
                    </div>
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
                    <Label htmlFor="deduction">Amount</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">₦</span>
                      <Input
                        id="deduction"
                        type="number"
                        min="0"
                        placeholder="25,000"
                        value={payrollData.deduction}
                        onChange={(e) => setPayrollData({...payrollData, deduction: e.target.value})}
                        className="pl-8"
                      />
                    </div>
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

              {/* Generate Button */}
              <Button 
                onClick={savePayroll} 
                className="w-full"
                disabled={!selectedEmployee || !selectedPeriod || !payrollData.basicSalary}
              >
                <Calculator className="mr-2 h-4 w-4" />
                Generate Payroll
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Payroll Breakdown */}
        <Card className="lg:col-span-2 border-border/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-primary flex items-center">
              <FileText className="mr-2 h-5 w-5" />
              Payroll Breakdown & Summary
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {currentPayrollRecord 
                ? isPreviewFromFinancialDetails
                  ? `Preview based on your base salary information (No payroll record generated yet)`
                  : `Pay Period: ${currentPayrollRecord.pay_period}`
                : "Detailed breakdown of earnings, deductions, and employer costs"}
            </p>
          </CardHeader>
          <CardContent>
            {currentPayrollRecord ? (
              <div className="space-y-6">
                {/* Summary Cards - From Database */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg border">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Gross Pay</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(currentPayrollRecord.gross_pay || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                    <p className="text-lg font-bold text-destructive">{formatCurrency(currentPayrollRecord.total_deductions || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Net Pay</p>
                    <p className="text-lg font-bold text-success">{formatCurrency(currentPayrollRecord.net_pay || 0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-1">Status</p>
                    <div className="mt-1">{getStatusBadge(currentPayrollRecord.status || 'pending')}</div>
                  </div>
                </div>

              {/* Salary Components - From Database */}
              <div className="border rounded-lg p-4 bg-card">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <span className="w-2 h-2 bg-success rounded-full"></span>
                    Salary Components
                  </h3>
                  {isPreviewFromFinancialDetails && (
                    <Badge variant="outline" className="text-xs">
                      Preview
                    </Badge>
                  )}
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Basic Salary:</span>
                    <span className="font-semibold">{formatCurrency(currentPayrollRecord.basic_salary || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Housing Allowance:</span>
                    <span>{formatCurrency(currentPayrollRecord.housing_allowance || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Transport Allowance:</span>
                    <span>{formatCurrency(currentPayrollRecord.transport_allowance || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Other Allowance:</span>
                    <span>{formatCurrency(currentPayrollRecord.other_allowance || 0)}</span>
                  </div>
                  {(currentPayrollRecord.overtime || 0) > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Overtime:</span>
                      <span>+{formatCurrency(currentPayrollRecord.overtime || 0)}</span>
                    </div>
                  )}
                  {(currentPayrollRecord.bonus || 0) > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Bonus:</span>
                      <span>+{formatCurrency(currentPayrollRecord.bonus || 0)}</span>
                    </div>
                  )}
                  {(currentPayrollRecord.commission || 0) > 0 && (
                    <div className="flex justify-between text-sm text-success">
                      <span>Commission:</span>
                      <span>+{formatCurrency(currentPayrollRecord.commission || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Deductions - From Database */}
              <div className="border rounded-lg p-4 bg-card">
                <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                  <span className="w-2 h-2 bg-destructive rounded-full"></span>
                  Deductions
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>PAYE Tax:</span>
                    <span>{formatCurrency(currentPayrollRecord.paye_tax || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Employee Pension (8%):</span>
                    <span>{formatCurrency(currentPayrollRecord.pension_employee || 0)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>NHF (2.5%):</span>
                    <span>{formatCurrency(currentPayrollRecord.nhf || 0)}</span>
                  </div>
                  {(currentPayrollRecord.other_deductions || 0) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Other Deductions:</span>
                      <span>{formatCurrency(currentPayrollRecord.other_deductions || 0)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Net Pay Summary */}
              <div className="border-2 border-success rounded-lg p-6 bg-success/5">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">Your Net Pay</p>
                  <p className="text-4xl font-bold text-success">{formatCurrency(currentPayrollRecord.net_pay || 0)}</p>
                  <p className="text-xs text-muted-foreground">
                    Gross: {formatCurrency(currentPayrollRecord.gross_pay || 0)} - Deductions: {formatCurrency(currentPayrollRecord.total_deductions || 0)}
                  </p>
                </div>
              </div>
            </div>
            ) : (
              <div className="text-center py-12 space-y-3">
                <div className="text-5xl text-muted-foreground/20">💰</div>
                <div>
                  <p className="font-medium text-muted-foreground">No Payroll Information Available</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">
                    {employees.find(emp => emp.email === user?.email)?.gross_salary || employees.find(emp => emp.email === user?.email)?.basic_salary
                      ? "Your payroll information will appear here once it's been processed by HR."
                      : "No salary information found. Please contact HR to set up your payroll details."}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Payroll History */}
      {(canHrPayroll(user) || user?.role === 'corporate_hr') && (
        <Card className="border-border/50 shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="text-primary">Payroll History - Edit & Update</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">Click edit to modify payroll records. Changes sync to employee records.</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />Bulk export ({selectedPeriod})
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={async () => {
                    try {
                      const blob = await apiService.exportPayrollBulkCsv(selectedPeriod)
                      const url = URL.createObjectURL(blob); const a = document.createElement('a')
                      a.href = url; a.download = `Payroll_${selectedPeriod}.csv`; a.click(); URL.revokeObjectURL(url)
                    } catch (e: any) {
                      // Backend failed — fall back to a client-side CSV from the rows already loaded
                      try {
                        const rows = visiblePayrollRecords.filter((r: any) => r.pay_period === selectedPeriod)
                        if (!rows.length) throw e
                        const headers = ['Employee','Period','Basic Salary','Bonus','Gross Pay','Net Pay','Status']
                        const csv = [
                          headers.join(','),
                          ...rows.map((r: any) => [
                            JSON.stringify(r.employee_display || r.employee_name || `Employee ${r.employee_id}`),
                            r.pay_period,
                            r.basic_salary ?? 0,
                            r.bonus ?? 0,
                            r.gross_pay ?? 0,
                            r.net_pay ?? 0,
                            r.status ?? '',
                          ].join(',')),
                        ].join('\n')
                        const blob = new Blob([csv], { type: 'text/csv' })
                        const url = URL.createObjectURL(blob); const a = document.createElement('a')
                        a.href = url; a.download = `Payroll_${selectedPeriod}.csv`; a.click(); URL.revokeObjectURL(url)
                        toast({ title: 'Used local fallback', description: 'Server bulk export failed — exported on-screen rows instead.' })
                      } catch {
                        toast({ title: 'Bulk CSV failed', description: e?.message, variant: 'destructive' })
                      }
                    }
                  }}>CSV</DropdownMenuItem>
                  <DropdownMenuItem onClick={async () => {
                    try {
                      const blob = await apiService.exportPayrollBulkPdf(selectedPeriod)
                      const url = URL.createObjectURL(blob); const a = document.createElement('a')
                      a.href = url; a.download = `Payroll_${selectedPeriod}.pdf`; a.click(); URL.revokeObjectURL(url)
                    } catch (e: any) { toast({ title: 'Bulk PDF failed', description: e?.message, variant: 'destructive' }) }
                  }}>PDF Summary</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                  ) : visiblePayrollRecords.length === 0 ? (
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
                    visiblePayrollRecords.map((record) => (
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
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-7 px-2"
                              onClick={() => startEditing(record)}
                            >
                              <Pencil className="h-3 w-3 mr-1" />
                              Edit
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button size="sm" variant="outline" className="h-7 px-2">
                                  <Download className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={async () => {
                                  const filename = `Payslip_${record.id}_${record.pay_period}.pdf`
                                  try {
                                    const blob = await apiService.exportPayrollRecordPdf(record.id!)
                                    const url = URL.createObjectURL(blob); const a = document.createElement('a')
                                    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
                                  } catch (e: any) {
                                    try {
                                      const { generatePayslipPdf, toPayslipLike } = await import('@/utils/payslipPdf')
                                      generatePayslipPdf(toPayslipLike(record), filename)
                                      toast({ title: 'PDF generated locally', description: 'Server export failed; built from displayed data.' })
                                    } catch (err: any) {
                                      toast({ title: 'PDF export failed', description: e?.message, variant: 'destructive' })
                                    }
                                  }
                                }}>Export PDF</DropdownMenuItem>
                                <DropdownMenuItem onClick={async () => {
                                  const filename = `Payslip_${record.id}_${record.pay_period}.csv`
                                  try {
                                    const blob = await apiService.exportPayrollRecordCsv(record.id!)
                                    const url = URL.createObjectURL(blob); const a = document.createElement('a')
                                    a.href = url; a.download = filename; a.click(); URL.revokeObjectURL(url)
                                  } catch (e: any) {
                                    try {
                                      const { generatePayslipCsv, toPayslipLike } = await import('@/utils/payslipPdf')
                                      generatePayslipCsv(toPayslipLike(record), filename)
                                      toast({ title: 'CSV generated locally', description: 'Server export failed; built from displayed data.' })
                                    } catch (err: any) {
                                      toast({ title: 'CSV export failed', description: e?.message, variant: 'destructive' })
                                    }
                                  }
                                }}>Export CSV</DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                            {canHrPayroll(user) && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 px-2 text-destructive hover:bg-destructive/10"
                                onClick={async () => {
                                  const reason = window.prompt('Reason for deletion (optional):') || undefined
                                  if (!window.confirm('Delete this payroll record?')) return
                                  try {
                                    await apiService.deletePayrollWithReason(record.id!, reason)
                                    toast({ title: 'Payroll deleted' })
                                    setPayrollRecords(prev => prev.filter(r => r.id !== record.id))
                                  } catch (e: any) {
                                    toast({ title: 'Delete failed', description: e?.message, variant: 'destructive' })
                                  }
                                }}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

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
                      value={editingValues.basic_salary || ''}
                      onChange={(e) => setEditingValues({...editingValues, basic_salary: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.housing_allowance || ''}
                      onChange={(e) => setEditingValues({...editingValues, housing_allowance: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.transport_allowance || ''}
                      onChange={(e) => setEditingValues({...editingValues, transport_allowance: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.other_allowance || ''}
                      onChange={(e) => setEditingValues({...editingValues, other_allowance: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.overtime || ''}
                      onChange={(e) => setEditingValues({...editingValues, overtime: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.bonus || ''}
                      onChange={(e) => setEditingValues({...editingValues, bonus: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.commission || ''}
                      onChange={(e) => setEditingValues({...editingValues, commission: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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
                      value={editingValues.other_deductions || ''}
                      onChange={(e) => setEditingValues({...editingValues, other_deductions: e.target.value === '' ? undefined : Number(e.target.value)})}
                      className="pl-8"
                      placeholder="Enter amount"
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