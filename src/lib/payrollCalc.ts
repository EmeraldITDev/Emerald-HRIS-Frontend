import type { Employee, PayrollRecord } from "@/lib/api"

const storageCandidates = (value: unknown): string[] => {
  const values = Array.isArray(value) ? value : [value]
  return Array.from(
    new Set(
      values
        .flatMap((v) => Array.isArray(v) ? v : [v])
        .filter((v) => v !== null && v !== undefined && v !== "")
        .map(String)
    )
  )
}

const readPayrollLocalValue = (prefix: string, employeeIds: unknown, periods: unknown): string | null => {
  try {
    if (typeof localStorage === "undefined") return null
    for (const employeeId of storageCandidates(employeeIds)) {
      for (const period of storageCandidates(periods)) {
        const raw = localStorage.getItem(`${prefix}:${employeeId}:${period}`)
        if (raw !== null) return raw
      }
    }
  } catch {
    return null
  }
  return null
}

const isNhfOptedOut = (employeeId: unknown, period: unknown): boolean => {
  if (!employeeId || !period) return false
  return readPayrollLocalValue("payroll_nhf_optout", employeeId, period) === "1"
}

/**
 * Annual rent-relief amount stored client-side during payroll generation.
 * Backend currently doesn't persist this, so we mirror it locally so payslip
 * views, list rows and PDFs can all reflect the same correct PAYE.
 */
const getAnnualRentRelief = (employeeId: unknown, period: unknown): number => {
  if (!employeeId || !period) return 0
  const raw = readPayrollLocalValue("payroll_rent_relief", employeeId, period)
  const n = Number(raw)
  return Number.isFinite(n) && n > 0 ? n : 0
}

export const toMoneyNumber = (value: unknown): number => {
  if (value === null || value === undefined || value === "") return 0
  const normalized = typeof value === "string" ? value.replace(/[₦,\s]/g, "") : value
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : 0
}

/** Annual gross in NGN from API top-level or financial_details (BE storage). */
export const getAnnualGrossSalary = (employee?: Partial<Employee> | null): number => {
  const financial = (employee as any)?.financial_details || {}
  const topLevelGross = toMoneyNumber((employee as any)?.gross_salary)
  if (topLevelGross > 0) return topLevelGross
  const financialGross = toMoneyNumber(financial.gross_salary)
  if (financialGross > 0) return financialGross
  return toMoneyNumber((employee as any)?.baseSalary)
}

const ACTIVE_PAYROLL_STATUSES = new Set(["active", "on probation", "probation"])

/** Employees who need annual gross set before payroll generation (BE rule: whole naira, ≥ 12). */
export const employeesMissingAnnualGross = (
  employees: Partial<Employee>[],
): Array<{ id?: number; code: string; name: string }> => {
  return employees
    .filter((emp) => {
      const status = (emp.employment_status || "").trim().toLowerCase()
      if (status && !ACTIVE_PAYROLL_STATUSES.has(status)) return false
      return getAnnualGrossSalary(emp) < 12
    })
    .map((emp) => ({
      id: emp.id,
      code: emp.employee_code || emp.employee_display || (emp.id ? `ID${emp.id}` : "—"),
      name: `${emp.first_name || ""} ${emp.last_name || ""}`.trim() || "Unknown",
    }))
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const roundMoney = (value: number): number => Math.round(value * 100) / 100

/**
 * PAYE from IT BREAKDOWN PAYROLL.xlsx (no CRA).
 * chargeable = totalYearlyIncome − (rentRelief + pension + NHF)
 * bands: 0% to ₦800k, then 15 / 18 / 21 / 23 / 25%
 */
export const calculateAnnualPaye = (
  annualGross: number,
  annualPension: number,
  annualNhf: number,
  annualRentRelief: number = 0,
  annualBonus: number = 0,
) => {
  const totalYearlyIncome = Math.max(annualGross, 0) + Math.max(annualBonus, 0)
  const taxExempt =
    Math.max(annualRentRelief, 0) + Math.max(annualPension, 0) + Math.max(annualNhf, 0)
  const chargeableIncome = Math.max(totalYearlyIncome - taxExempt, 0)

  let annualTax = 0
  const q = chargeableIncome
  if (q > 800000) {
    const first15 = (3000000 - 800000) * 0.15
    const next18 = (12000000 - 3000000) * 0.18
    const next21 = (25000000 - 12000000) * 0.21
    const next23 = (50000000 - 25000000) * 0.23
    if (q <= 3000000) {
      annualTax = (q - 800000) * 0.15
    } else if (q <= 12000000) {
      annualTax = first15 + (q - 3000000) * 0.18
    } else if (q <= 25000000) {
      annualTax = first15 + next18 + (q - 12000000) * 0.21
    } else if (q <= 50000000) {
      annualTax = first15 + next18 + next21 + (q - 25000000) * 0.23
    } else {
      annualTax = first15 + next18 + next21 + next23 + (q - 50000000) * 0.25
    }
  }

  return { annualTax, taxableIncome: chargeableIncome }
}

export const getEmployeePayrollPackage = (
  employee?: Partial<Employee> | null,
  opts?: { annualRentRelief?: number; annualBonus?: number },
) => {
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
      annualBasic = annualGrossFromProfile
      annualHousing = annualTransport = annualMeal = annualOther = 0
    } else {
      // Authoritative split — mirrors IT BREAKDOWN PAYROLL.xlsx / backend
      annualBasic = annualGrossFromProfile * 0.4
      annualHousing = annualGrossFromProfile * 0.2
      annualTransport = annualGrossFromProfile * 0.09
      annualOther = annualGrossFromProfile * 0.31
      annualMeal = 0
    }
  }

  const annualAllowances = annualHousing + annualTransport + annualMeal + annualOther
  const annualGross = annualGrossFromProfile || annualBasic + annualAllowances
  const annualBonus = isContract ? 0 : Math.max(opts?.annualBonus || 0, 0)
  // Excel: pension = 8% × 69% × K (year gross + yearly bonus); NHF = 2.5% × 40% × H (gross only)
  const annualPension = isContract ? 0 : 0.08 * 0.69 * (annualGross + annualBonus)
  const annualNhf = isContract ? 0 : annualGross * 0.4 * 0.025
  const annualPensionEmployer = isContract ? 0 : 0.1 * 0.69 * annualGross
  const annualRentRelief = isContract ? 0 : Math.max(opts?.annualRentRelief || 0, 0)
  const baseline = isContract
    ? { annualTax: annualGross * 0.05, taxableIncome: annualGross }
    : calculateAnnualPaye(annualGross, annualPension, annualNhf, 0, annualBonus)
  const { annualTax, taxableIncome } = isContract
    ? baseline
    : calculateAnnualPaye(annualGross, annualPension, annualNhf, annualRentRelief, annualBonus)
  const annualRentReliefSaving = Math.max(baseline.annualTax - annualTax, 0)

  // Round each statutory line to kobo first so PAYE+Pension+NHF = Total and Net adds up.
  const monthlyGrossRounded = roundMoney(annualGross / 12)
  const monthlyPaye = roundMoney(annualTax / 12)
  const monthlyPension = roundMoney(annualPension / 12)
  const monthlyNhf = roundMoney(annualNhf / 12)
  const monthlyStatutory = roundMoney(monthlyPaye + monthlyPension + monthlyNhf)
  const monthlyNet = roundMoney(monthlyGrossRounded - monthlyStatutory)

  return {
    annualGross: roundMoney(annualGross),
    annualBonus: roundMoney(annualBonus),
    annualBasic: roundMoney(annualBasic),
    annualHousing: roundMoney(annualHousing),
    annualTransport: roundMoney(annualTransport),
    annualMeal: roundMoney(annualMeal),
    annualOther: roundMoney(annualOther),
    annualPension: roundMoney(annualPension),
    annualPensionEmployer: roundMoney(annualPensionEmployer),
    annualNhf: roundMoney(annualNhf),
    annualTax: roundMoney(annualTax),
    annualTaxableIncome: roundMoney(taxableIncome),
    monthlyBasic: roundMoney(annualBasic / 12),
    monthlyHousing: roundMoney(annualHousing / 12),
    monthlyTransport: roundMoney(annualTransport / 12),
    monthlyMeal: roundMoney(annualMeal / 12),
    monthlyOther: roundMoney(annualOther / 12),
    monthlyGross: monthlyGrossRounded,
    monthlyPension,
    monthlyNhf,
    monthlyPaye,
    monthlyPensionEmployer: roundMoney(annualPensionEmployer / 12),
    monthlyStatutory,
    monthlyNet,
    annualRentRelief: roundMoney(annualRentRelief),
    monthlyRentRelief: roundMoney(annualRentRelief / 12),
    annualRentReliefSaving: roundMoney(annualRentReliefSaving),
    monthlyRentReliefSaving: roundMoney(annualRentReliefSaving / 12),
  }
}

export type PayrollPackage = ReturnType<typeof getEmployeePayrollPackage>

export const normalizePayrollRecord = (
  record: PayrollRecord,
  employee?: Partial<Employee> | null
): PayrollRecord => {
  const empIds = [
    (record as any).employee_id,
    (record as any).employee?.id,
    (record as any).employee?.employee_id,
    (record as any).employeeCode,
    (employee as any)?.id,
    (employee as any)?.employee_id,
    (employee as any)?.employee_code,
  ]
  const period = (record as any).pay_period ?? (record as any).payPeriod ?? (record as any).period
  const overtime = toMoneyNumber((record as any).overtime)
  const bonus = toMoneyNumber((record as any).bonus)
  const commission = toMoneyNumber((record as any).commission)
  // Backend sometimes stores stale or duplicated other_deductions on the
  // list endpoint that the detail endpoint omits. The payslip-detail view is
  // treated as the source of truth, so ignore record-level other_deductions
  // here to keep the My Payslips list net pay in sync with the detail view.
  const otherDeductions = 0
  const annualRentRelief = getAnnualRentRelief(empIds, period)
  const pkg = getEmployeePayrollPackage(employee || (record as any).employee, {
    annualRentRelief,
    annualBonus: bonus * 12,
  })
  if (pkg.annualGross === 0) return record

  const recordNhfRaw = (record as any).nhf
  const optedOut = isNhfOptedOut(empIds, period)
  const nhf = optedOut
    ? 0
    : recordNhfRaw !== undefined && recordNhfRaw !== null
      ? toMoneyNumber(recordNhfRaw)
      : pkg.monthlyNhf
  const grossPay = roundMoney(pkg.monthlyGross + overtime + bonus + commission)
  const totalAllowances = pkg.monthlyHousing + pkg.monthlyTransport + pkg.monthlyMeal + pkg.monthlyOther
  // Prefer Excel-style statutory total, then add other deductions
  const statutory = roundMoney(pkg.monthlyPaye + pkg.monthlyPension + nhf)
  const totalDeductions = roundMoney(statutory + otherDeductions)

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
    rent_relief: pkg.monthlyRentRelief,
    rent_relief_saving: pkg.monthlyRentReliefSaving,
    pension_employee: pkg.monthlyPension,
    nhf,
    gross_pay: grossPay,
    total_deductions: totalDeductions,
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
  const detailEmpIds = [
    detail?.employee?.id,
    detail?.employee?.employee_id,
    detail?.employee?.employee_code,
    detail?.employee_id,
    detail?.employeeCode,
    detail?.employee_code,
    (employee as any)?.id,
    (employee as any)?.employee_id,
    (employee as any)?.employee_code,
  ]
  const detailPeriods = [detail?.pay_period, detail?.payPeriod, detail?.period]
  const annualRentRelief = getAnnualRentRelief(detailEmpIds, detailPeriods)
  const overtime = toMoneyNumber(detail?.earnings?.overtime)
  const bonus = toMoneyNumber(detail?.earnings?.bonus)
  const commission = toMoneyNumber(detail?.earnings?.commission)
  const pkg = getEmployeePayrollPackage(employee, {
    annualRentRelief,
    annualBonus: bonus * 12,
  })
  if (pkg.annualGross === 0) return detail

  const otherDeductions = toMoneyNumber(detail?.deductions?.otherDeductions)
  const detailNhfRaw = detail?.deductions?.nhf
  const optedOut = isNhfOptedOut(detailEmpIds, detailPeriods)
  // Always use package NHF/PAYE/pension so Excel formula wins over stale stored rows
  const nhf = optedOut ? 0 : pkg.monthlyNhf
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
      rentRelief: pkg.monthlyRentRelief,
      rentReliefSaving: pkg.monthlyRentReliefSaving,
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