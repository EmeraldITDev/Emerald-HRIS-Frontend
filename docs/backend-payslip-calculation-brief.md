# Backend brief — Server-generated payslip is producing false figures

## Symptom

Server-issued payslip PDF for **Henry Marcus (LM002), May 2026** shows:

| Component | Amount (NGN) | Backend "remark" |
|---|---:|---|
| Basic Salary (40%) | 0.00 | "0% of Gross" |
| Housing Allowance (20%) | 24,000.00 | "69% of Gross" |
| Transport Allowance (9%) | 10,800.00 | "31% of Gross" |
| All Other Allowances (31%) | 0.00 | "0% of Gross" |
| **Gross Monthly Salary** | **34,800.00** | |
| PAYE | 1,269.33 | |
| Pension (Employee) | 2,784.00 | "8% of BHT" |
| **Net Monthly Pay** | **30,746.67** | |

This is wrong on two levels:

1. The labels say `40% / 20% / 9% / 31%` but the actual figures clearly
   weren't computed from the employee's `gross_salary`. Basic and Other are
   `0`, while Housing/Transport are populated from stale/seeded values.
2. The remarks (`69% of Gross`, `31% of Gross`, `8% of BHT`) are computed
   against the broken gross, so they look internally consistent but are
   meaningless.

The frontend already recomputes correct values on the fly via
`src/lib/payrollCalc.ts` (`getEmployeePayrollPackage` → `normalizePayslipDetail`),
but **the server-generated PDF bypasses the frontend entirely**, so HR/employees
downloading from the backend still receive false figures.

## Root cause (on the backend)

The payslip generator is reading partial / seeded columns
(`housing_allowance`, `transport_allowance`, …) directly from `employees`
or `payroll_runs` instead of deriving the full package from a single
source of truth (`employees.gross_salary`, annual). When those columns are
missing or zero (which is the case for newly-onboarded staff like Henry
Marcus), the PDF prints `0.00` for Basic and Other while keeping whatever
legacy value sat in Housing/Transport.

## Required fix (backend)

Always derive monthly payslip lines from **annual `gross_salary`** at
generation time. Mirror the frontend formula so HR's dashboard, the
employee's MyPayslips view, and the downloaded PDF all agree.

### Splits (full-time / permanent)

```
annual_basic     = gross_salary * 0.40
annual_housing   = gross_salary * 0.20
annual_transport = gross_salary * 0.09
annual_other     = gross_salary * 0.31
```

### Splits (contract / `employment_type = 'contract'`)

```
annual_basic = gross_salary
annual_housing = annual_transport = annual_meal = annual_other = 0
```

### Statutory deductions (permanent only; contract uses 5% WHT on gross)

```
bht            = annual_basic + annual_housing + annual_transport
annual_pension = bht * 0.08
annual_nhf     = annual_basic * 0.025
```

### PAYE (Nigerian progressive bands, on consolidated relief allowance)

```
gross_for_cra   = max(gross_salary - annual_pension - annual_nhf, 0)
cra             = gross_for_cra * 0.20 + max(gross_for_cra * 0.01, 200_000)
taxable_income  = max(gross_salary - cra - annual_pension - annual_nhf, 0)

bands = [
  (  300_000, 0.07),
  (  300_000, 0.11),
  (  500_000, 0.15),
  (  500_000, 0.19),
  (1_600_000, 0.21),
  (  Infinity, 0.24),
]
annual_paye = sum over bands of min(remaining, band_width) * rate
```

### Monthly figures

Divide every annual figure by 12 and round to 2 dp. Persist the monthly
breakdown on the payroll line item — do NOT re-derive from per-column
overrides on subsequent renders.

### Verification for Henry Marcus (LM002)

If `employees.gross_salary` is, say, `1,200,000` (annual), the May 2026
payslip MUST show:

| Component | Annual | Monthly |
|---|---:|---:|
| Basic (40%) | 480,000 | 40,000 |
| Housing (20%) | 240,000 | 20,000 |
| Transport (9%) | 108,000 |  9,000 |
| Other (31%) | 372,000 | 31,000 |
| **Gross** | **1,200,000** | **100,000** |
| Pension (8% of BHT) | 66,240 | 5,520 |
| NHF (2.5% of Basic) | 12,000 | 1,000 |
| PAYE | computed from bands | / 12 |

If the source `gross_salary` is missing/zero, the payslip generator must
**raise an explicit error** ("employee has no gross_salary configured")
rather than emit a partial PDF with `0.00` lines.

## Acceptance criteria

- [ ] Server-generated payslip PDF matches the figures rendered in the
      frontend's "My Payslips" view for the same employee + period.
- [ ] No payslip row, dashboard cell, or PDF line shows `0.00` for Basic
      Salary when the employee has a non-zero `gross_salary`.
- [ ] The `(40%) / (20%) / (9%) / (31%)` labels reflect the actual ratio,
      i.e. the printed Basic IS 40% of the printed Gross.
- [ ] Pension and NHF computed against BHT and Basic respectively, not
      against the broken gross.
- [ ] Contract employees use the WHT/5% path, no statutory deductions.
- [ ] When `gross_salary` is missing, the generator returns `422` with a
      clear "configure gross_salary" message instead of producing a PDF.

Reference implementation (authoritative for the formulas):
`src/lib/payrollCalc.ts` → `getEmployeePayrollPackage`.
