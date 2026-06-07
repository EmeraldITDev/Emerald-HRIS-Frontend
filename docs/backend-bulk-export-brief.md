# Backend brief — Bulk Payroll Export (PDF + CSV)

## Endpoints
- `GET /payroll/export/bulk.pdf?period=YYYY-MM`
- `GET /payroll/export/bulk.csv?period=YYYY-MM`

## Problems to fix

1. **Not all employees are included.** The current bulk export only returns a partial set (looks paginated or filtered to the caller's scope). It must return **every processed payroll record for the given `period`**, across all departments, with no pagination truncation.

2. **Not all requested data fields are included.** The current bulk exports are missing several line-item columns that appear on the on-screen payslip view.

## Required columns (in this order)

The bulk PDF and CSV must include a column for each of the following, populated from the same calculation logic used for the individual on-screen payslip (`src/lib/payrollCalc.ts` / `getEmployeePayrollPackage`):

| Column | Data source / notes |
|--------|---------------------|
| Employee | Employee full name (`first_name` + `last_name`) |
| Employee ID | Employee ID (`employee_id` / `id`) |
| Pay Period | Period label (e.g. `YYYY-MM`) |
| Basic Salary | Base monthly salary for the period |
| Housing Allowance | Housing allowance amount |
| Transport Allowance | Transport allowance amount |
| Other Allowances | Any other allowance line items |
| Additional Earnings | Any additional earnings line items |
| Monthly Gross | Total gross for the period |
| PAYE Tax | Tax withheld |
| Pension Contribution | Employee pension contribution |
| Personal Deductions | Any other personal deduction line items |

## Calculation alignment

The figures in the bulk export must match `getEmployeePayrollPackage` exactly for the same employee + period. If the backend uses a separate calculation path for bulk export, consolidate it so there is one source of truth.

## Totals row

Include a totals row at the bottom of both PDF and CSV summing each monetary column. This total must reconcile with the dashboard's monthly payroll figure for the same period.

## Acceptance checklist

- [ ] Calling `GET /payroll/export/bulk.csv?period=2026-06` lists every employee with a processed record for that period, not just a subset.
- [ ] Both PDF and CSV contain all 12 columns above with correct values matching the on-screen Payslip view.
- [ ] Figures match `src/lib/payrollCalc.ts` (`getEmployeePayrollPackage`) exactly for the same employee/period.
- [ ] Totals row reconciles with the dashboard's monthly payroll figure.
