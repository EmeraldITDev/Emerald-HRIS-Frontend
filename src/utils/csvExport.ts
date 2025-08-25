import { Employee } from '@/lib/api'

export interface ExportOptions {
  includePersonalInfo?: boolean
  includeFinancialInfo?: boolean
  includeGovernmentIds?: boolean
  includePerformanceData?: boolean
  dateRange?: {
    start: Date
    end: Date
  }
  departments?: string[]
  employmentStatus?: string[]
}

export const exportEmployeeDirectory = (employees: Employee[]): string => {
  const headers = [
    'Employee ID',
    'First Name',
    'Last Name',
    'Email',
    'Department',
    'Job Title',
    'Phone Number',
    'Employment Status',
    'Hire Date',
    'Work Location'
  ]

  const rows = employees.map(emp => [
    emp.id,
    emp.first_name,
    emp.last_name,
    emp.email,
    emp.department,
    emp.job_title,
    emp.phone_number,
    emp.employment_status,
    emp.hire_date,
    emp.work_location
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const exportPayrollData = (employees: Employee[]): string => {
  const headers = [
    'Employee ID',
    'Name',
    'Department',
    'Basic Salary',
    'Meal Allowance',
    'Housing Allowance',
    'Transport Allowance',
    'Total Salary',
    'Bank Account',
    'Employment Type'
  ]

  const rows = employees.map(emp => {
    const totalSalary = (emp.gross_salary || 0) + 
                       (emp.meal_allowance || 0) + 
                       (emp.housing_allowance || 0) + 
                       (emp.transport_allowance || 0)
    
    return [
      emp.id,
      `${emp.first_name} ${emp.last_name}`,
      emp.department,
      emp.gross_salary?.toLocaleString(),
      emp.meal_allowance?.toLocaleString(),
      emp.housing_allowance?.toLocaleString(),
      emp.transport_allowance?.toLocaleString(),
      totalSalary.toLocaleString(),
      emp.bank_account,
      emp.employment_type
    ]
  })

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const exportComplianceData = (employees: Employee[]): string => {
  const headers = [
    'Employee ID',
    'Name',
    'NIN',
    'BVN',
    'TIN',
    'Pension PIN',
    'NHF Number',
    'Tax ID',
    'Employment Status',
    'Department'
  ]

  const rows = employees.map(emp => [
    emp.id,
    `${emp.first_name} ${emp.last_name}`,
    emp.national_id,
    emp.bvn,
    emp.tin,
    emp.pension_pin,
    emp.nhf_number,
    emp.tax_id,
    emp.employment_status,
    emp.department
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const exportDepartmentAnalytics = (employees: Employee[]): string => {
  const deptStats = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned'
    if (!acc[dept]) {
      acc[dept] = {
        count: 0,
        totalSalary: 0,
        activeCount: 0,
        onLeaveCount: 0
      }
    }
    
    acc[dept].count++
    acc[dept].totalSalary += (emp.gross_salary || 0)
    
    if (emp.employment_status === 'Active') {
      acc[dept].activeCount++
    } else if (emp.employment_status === 'On Leave') {
      acc[dept].onLeaveCount++
    }
    
    return acc
  }, {} as Record<string, any>)

  const headers = [
    'Department',
    'Total Employees',
    'Active Employees',
    'On Leave',
    'Total Salary Budget',
    'Average Salary'
  ]

  const rows = Object.entries(deptStats).map(([dept, stats]) => [
    dept,
    stats.count,
    stats.activeCount,
    stats.onLeaveCount,
    stats.totalSalary.toLocaleString(),
    Math.round(stats.totalSalary / stats.count).toLocaleString()
  ])

  return [headers, ...rows].map(row => row.join(',')).join('\n')
}

export const downloadCSV = (data: string, filename: string): void => {
  const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
