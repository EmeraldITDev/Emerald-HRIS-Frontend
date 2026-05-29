import type { Employee, PayrollRecord } from "@/lib/api"

const isNhfOptedOut = (employeeId: unknown, period: unknown): boolean => {
  if (!employeeId || !period) return false
  try {
    return typeof localStorage !== "undefined" &&
      localStorage.getItem(`payroll_nhf_optout:${employeeId}:${period}`) === "1"
  } catch {
    return false
  }
}

export const toMoneyNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0
  const normalized = typeof value === "string" ? value.replace(/[₦,\s]/g, "") : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

export const roundMoney = (value: number): number => Math.round(value * 100) / 100

export const calculateAnnualPaye = (annualGross: number, annualPension: number, annualNhf: number) => {
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

export const getEmployeePayrollPackage = (employee?: Partial<Employee> | null) => {
  const employmentType = (employee?.employment_type || "").toLowerCase()
  const isContract = employmentType === "contract"
  const financial = (employee as any)?.financial_details || {}
  const annualGrossFromProfile = toMoneyNumber(
    (employee as any)?.gross_salary ?? financial.gross_salary ?? (employee as any)?.baseSalary
  )
  let annualBasic = toMoneyNumber((employee as any)?.basic_salary ?? financial.basic_salary)
  let annualHousing = toMoneyNumber((employee as any)?.housing_allowance ?? financial.housing_allowance)
  let annualTransport = toMoneyNumber((employee as any)?.transport_allowance ?? financial.transport_allowance)
  let annualMeal = toMoneyNumber((employee as any)?.meal_allowance ?? financial.meal_allowance)
  let annualOther = toMoneyNumber((employee as any)?.other_allowance ?? financial.other_allowance)

  if (annualGrossFromProfile > 0) {
    if (isContract) {
      annualBasic = annualBasic || annualGrossFromProfile
      annualHousing = annualTransport = annualMeal = annualOther = 0
    } else {
      // Monthly Basic = Annual Gross / 12 — no percentage-based defaulting
      // Always derive from the profile gross so stale `basic_salary` values
      // persisted under the previous 40%-of-gross rule are ignored.
      annualBasic = annualGrossFromProfile
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

export type PayrollPackage = ReturnType<typeof getEmployeePayrollPackage>

export const normalizePayrollRecord = (
  record: PayrollRecord,
  employee?: Partial<Employee> | null
): PayrollRecord => {
  const pkg = getEmployeePayrollPackage(employee || (record as any).employee)
  if (pkg.annualGross === 0) return record

  const overtime = toMoneyNumber((record as any).overtime)
  const bonus = toMoneyNumber((record as any).bonus)
  const commission = toMoneyNumber((record as any).commission)
  const otherDeductions = toMoneyNumber((record as any).other_deductions)
  const recordNhfRaw = (record as any).nhf
  const optedOut = isNhfOptedOut((record as any).employee_id, (record as any).pay_period)
  const nhf = optedOut
    ? 0
    : recordNhfRaw !== undefined && recordNhfRaw !== null
      ? toMoneyNumber(recordNhfRaw)
      : pkg.monthlyNhf
  const grossPay = pkg.monthlyGross + overtime + bonus + commission
  const totalAllowances = pkg.monthlyHousing + pkg.monthlyTransport + pkg.monthlyMeal + pkg.monthlyOther
  const totalDeductions = pkg.monthlyPaye + pkg.monthlyPension + nhf + otherDeductions

  return {
    ...record,
    basic_salary: pkg.monthlyBasic,
    housing_allowance: pkg.monthlyHousing,
    transport_allowance: pkg.monthlyTransport,
    meal_allowance: pkg.monthlyMeal,
    other_allowance: pkg.monthlyOther,
    total_allowances: roundMoney(totalAllowances),
    taxable_income: roundMoney(pkg.annualTaxableIncome / 12),
    paye_tax: pkg.monthlyPaye,
    pension_employee: pkg.monthlyPension,
    nhf,
    gross_pay: roundMoney(grossPay),
    total_deductions: roundMoney(totalDeductions),
    net_pay: roundMoney(grossPay - totalDeductions),
  } as PayrollRecord
}

/**
 * Normalize the nested payslip-detail shape returned by /payroll/payslip/{id}/{period}.
 * Overrides backend earnings/deductions/totals/summary with the employee's true
 * monthly package, while preserving meta fields (period, status, names, etc).
 */
export const normalizePayslipDetail = (detail: any, employee?: Partial<Employee> | null): any => {
  if (!detail) return detail
  const pkg = getEmployeePayrollPackage(employee)
  if (pkg.annualGross === 0) return detail

  const overtime = toMoneyNumber(detail?.earnings?.overtime)
  const bonus = toMoneyNumber(detail?.earnings?.bonus)
  const commission = toMoneyNumber(detail?.earnings?.commission)
  const otherDeductions = toMoneyNumber(detail?.deductions?.otherDeductions)
  const detailNhfRaw = detail?.deductions?.nhf
  const detailEmpId = detail?.employee?.id ?? detail?.employee_id ?? detail?.employeeCode
  const detailPeriod = detail?.pay_period ?? detail?.payPeriod
  const optedOut = isNhfOptedOut(detailEmpId, detailPeriod)
  const nhf = optedOut
    ? 0
    : detailNhfRaw !== undefined && detailNhfRaw !== null
      ? toMoneyNumber(detailNhfRaw)
      : pkg.monthlyNhf
  const grossSalary = roundMoney(pkg.monthlyGross + overtime + bonus + commission)
  const totalDeductions = roundMoney(pkg.monthlyPaye + pkg.monthlyPension + nhf + otherDeductions)
  const netSalary = roundMoney(grossSalary - totalDeductions)

  return {
    ...detail,
    earnings: {
      ...(detail.earnings || {}),
      baseSalary: pkg.monthlyBasic,
      housingAllowance: pkg.monthlyHousing,
      transportAllowance: pkg.monthlyTransport,
      mealAllowance: pkg.monthlyMeal,
      otherAllowance: pkg.monthlyOther,
      overtime,
      bonus,
      commission,
    },
    deductions: {
      ...(detail.deductions || {}),
      incomeTax: pkg.monthlyPaye,
      pensionContribution: pkg.monthlyPension,
      nhf,
      otherDeductions,
    },
    totals: {
      ...(detail.totals || {}),
      grossSalary,
      totalAllowances: roundMoney(pkg.monthlyHousing + pkg.monthlyTransport + pkg.monthlyMeal + pkg.monthlyOther),
    },
    summary: {
      ...(detail.summary || {}),
      grossSalary,
      totalDeductions,
      netSalary,
    },
  }
}