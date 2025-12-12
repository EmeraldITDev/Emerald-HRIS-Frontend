import { Employee } from '@/lib/api'

export interface Celebration {
  id: number
  employee: Employee
  type: 'birthday' | 'anniversary'
  date: Date
  displayDate: string
  day: number
  yearsOfService?: number
  message: string
}

/**
 * Calculate work anniversary date (1 year from hire_date)
 * Returns the anniversary date for the current year
 */
export function getWorkAnniversaryDate(hireDate: string | Date | null | undefined): Date | null {
  if (!hireDate) return null
  
  const hire = new Date(hireDate)
  const today = new Date()
  const currentYear = today.getFullYear()
  
  // Create anniversary date for current year
  const anniversary = new Date(currentYear, hire.getMonth(), hire.getDate())
  
  return anniversary
}

/**
 * Calculate years of service from hire date
 */
export function getYearsOfService(hireDate: string | Date | null | undefined): number {
  if (!hireDate) return 0
  
  const hire = new Date(hireDate)
  const today = new Date()
  
  let years = today.getFullYear() - hire.getFullYear()
  const monthDiff = today.getMonth() - hire.getMonth()
  
  // If anniversary hasn't occurred this year yet, subtract 1
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < hire.getDate())) {
    years--
  }
  
  return Math.max(0, years)
}

/**
 * Check if a date is in the current month
 */
export function isInCurrentMonth(date: Date | null): boolean {
  if (!date) return false
  
  const today = new Date()
  return date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear()
}

/**
 * Get all birthdays and anniversaries for the current month
 */
export function getCurrentMonthCelebrations(employees: Employee[]): Celebration[] {
  const today = new Date()
  const currentMonth = today.getMonth()
  const currentYear = today.getFullYear()
  
  const celebrations: Celebration[] = []
  
  employees.forEach(emp => {
    // Birthday celebrations
    if (emp.dob) {
      const dob = new Date(emp.dob)
      const birthdayThisYear = new Date(currentYear, dob.getMonth(), dob.getDate())
      
      if (birthdayThisYear.getMonth() === currentMonth) {
        celebrations.push({
          id: emp.id || 0,
          employee: emp,
          type: 'birthday',
          date: birthdayThisYear,
          displayDate: birthdayThisYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          day: birthdayThisYear.getDate(),
          message: `${emp.first_name} ${emp.last_name}'s birthday`
        })
      }
    }
    
    // Work anniversary celebrations
    if (emp.hire_date) {
      const hireDate = new Date(emp.hire_date)
      const anniversaryThisYear = new Date(currentYear, hireDate.getMonth(), hireDate.getDate())
      
      if (anniversaryThisYear.getMonth() === currentMonth) {
        const yearsOfService = getYearsOfService(emp.hire_date)
        
        celebrations.push({
          id: emp.id || 0,
          employee: emp,
          type: 'anniversary',
          date: anniversaryThisYear,
          displayDate: anniversaryThisYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          day: anniversaryThisYear.getDate(),
          yearsOfService: yearsOfService,
          message: `${emp.first_name} ${emp.last_name}'s ${yearsOfService} year${yearsOfService !== 1 ? 's' : ''} work anniversary`
        })
      }
    }
  })
  
  // Sort by day of month
  return celebrations.sort((a, b) => a.day - b.day)
}

/**
 * Get upcoming celebrations (within next 7 days)
 */
export function getUpcomingCelebrations(employees: Employee[], daysAhead: number = 7): Celebration[] {
  const today = new Date()
  const upcomingDate = new Date(today)
  upcomingDate.setDate(today.getDate() + daysAhead)
  
  const celebrations: Celebration[] = []
  
  employees.forEach(emp => {
    // Birthday celebrations
    if (emp.dob) {
      const dob = new Date(emp.dob)
      const birthdayThisYear = new Date(today.getFullYear(), dob.getMonth(), dob.getDate())
      
      // Check if birthday is within the next 7 days
      if (birthdayThisYear >= today && birthdayThisYear <= upcomingDate) {
        celebrations.push({
          id: emp.id || 0,
          employee: emp,
          type: 'birthday',
          date: birthdayThisYear,
          displayDate: birthdayThisYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          day: birthdayThisYear.getDate(),
          message: `${emp.first_name} ${emp.last_name}'s birthday`
        })
      }
    }
    
    // Work anniversary celebrations
    if (emp.hire_date) {
      const hireDate = new Date(emp.hire_date)
      const anniversaryThisYear = new Date(today.getFullYear(), hireDate.getMonth(), hireDate.getDate())
      
      // Check if anniversary is within the next 7 days
      if (anniversaryThisYear >= today && anniversaryThisYear <= upcomingDate) {
        const yearsOfService = getYearsOfService(emp.hire_date)
        
        celebrations.push({
          id: emp.id || 0,
          employee: emp,
          type: 'anniversary',
          date: anniversaryThisYear,
          displayDate: anniversaryThisYear.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
          day: anniversaryThisYear.getDate(),
          yearsOfService: yearsOfService,
          message: `${emp.first_name} ${emp.last_name}'s ${yearsOfService} year${yearsOfService !== 1 ? 's' : ''} work anniversary`
        })
      }
    }
  })
  
  // Sort by date
  return celebrations.sort((a, b) => a.date.getTime() - b.date.getTime())
}

