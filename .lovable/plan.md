# Edit Employee Form — Full Field Parity with Add Employee

## Goal
Make the Edit Employee dialog a complete mirror of the Add Employee dialog: same fields, same input types, same options, same required-field validation, same layout order and tab grouping. All fields pre-populate from the saved employee record. Auto-calculated/disabled financial fields, hire-date behavior, and the Additional tab's document uploader are left untouched.

---

## Audit — Add vs Edit (all 5 tabs, all 52 fields)

Source: `src/pages/Employees.tsx`. Add dialog ~lines 1708–3000, Edit dialog ~lines 3362–4267.

### Tab: Personal
| # | Field | Add | Edit | Status |
|---|---|---|---|---|
| 1 | First Name * | Input | Input | PRESENT |
| 2 | Middle Name | Input | Input | PRESENT |
| 3 | Last Name * | Input | Input | PRESENT |
| 4 | Date of Birth * | DateInput | DateInput | PRESENT (validation gap) |
| 5 | Gender * | Select | Select | PRESENT |
| 6 | Marital Status * | Select | Select | PRESENT |
| 7 | Nationality * | Select | Select | PRESENT |
| 8 | Phone Number * | Input | Input | PRESENT |
| 9 | Email * | Input | Input | PRESENT |
| 10 | Home Address * | Textarea | Textarea | PRESENT (validation gap) |
| 11 | Emergency Contact Name * | Input | — | **MISSING** |
| 12 | Emergency Contact Number * | Input | — | **MISSING** |
| 13 | Next of Kin Name * | Input | — | **MISSING** |
| 14 | Next of Kin Relationship * | Input | — | **MISSING** |
| 15 | Next of Kin Phone Number * | Input | — | **MISSING** |
| 16 | Next of Kin Email * | Input | — | **MISSING** |
| 17 | Next of Kin Address * | Textarea | — | **MISSING** |

### Tab: Job Info
| # | Field | Add | Edit | Status |
|---|---|---|---|---|
| 18 | Job Title * | Input | Input | PRESENT |
| 19 | Department * | Select | Select | PRESENT |
| 20 | Employment Type * | Select (4 opts) | Select (5 opts — extra "Intern") | **MISMATCH** |
| 21 | Grade Level * | Select | plain Input | **MISMATCH** |
| 22 | Supervisor Name * | Input | Input | PRESENT (validation gap) |
| 23 | Work Location * | Input | Input | PRESENT (validation gap) |
| 24 | Hire Date * | DateInput | DateInput | PRESENT |
| 25 | Probation Period * | Select | Select | PRESENT (validation gap) |
| 26 | Confirmation Date (auto) | readOnly Input | readOnly Input | PRESENT |
| 27 | Employment Status | Select (7 opts) | Select (5 opts) | **MISMATCH** |
| 28 | Vacation Days | Select 7–20 | number Input + duplicate in Additional tab | **MISMATCH** |

### Tab: Financial
| # | Field | Add | Edit | Status |
|---|---|---|---|---|
| 29 | Gross Salary (Annual) * | Input | Input | PRESENT |
| 30 | Basic Salary (40%) | readOnly auto-calc | readOnly auto-calc | PRESENT (do not touch) |
| 31 | Housing Allowance (20%) | readOnly auto-calc | readOnly auto-calc | PRESENT (do not touch) |
| 32 | Transport Allowance (9%) | readOnly auto-calc | readOnly auto-calc | PRESENT (do not touch) |
| 33 | Other Allowance (31%) | readOnly auto-calc | readOnly auto-calc | PRESENT (do not touch) |
| 34 | Bank Name | nationality-gated Select | plain Input | **MISMATCH** |
| 35 | Account Number | Input | Input | PRESENT |
| 36 | NUBAN | Input | Input | PRESENT |
| 37 | Sort Code | Input | Input | PRESENT |

### Tab: Gov IDs
| # | Field | Add | Edit | Status |
|---|---|---|---|---|
| 38 | Employee ID | Input (disabled w/ role) | Input (always disabled) | PRESENT |
| 39 | National ID (NIN) * | Input | Input | PRESENT (missing `*` + validation) |
| 40 | Passport Number | Input | Input | PRESENT |
| 41 | BVN | Input | Input | PRESENT |
| 42 | TIN | Input | Input | PRESENT |
| 43 | Pension PIN | Input | Input | PRESENT |
| 44 | NHF Number | Input | Input | PRESENT |
| 45 | Tax ID | Input | Input | PRESENT |

### Tab: Additional
| # | Field | Add | Edit | Status |
|---|---|---|---|---|
| 46–52 | 7 file pickers (NIN docs, passport photos, CV, education certs, prof certs, company assets, other) | per-category Inputs | Unified type-selector + uploader + current docs list | KEEP AS-IS (per scope) |
| — | Vacation Days (Additional tab) | not present | number Input bound to `vacation_days` | **REMOVE** — duplicate of Job tab field |

---

## Fixes to apply

### 1. Personal tab — add 7 missing inputs
Append an "Emergency Contact & Next of Kin" grouping at the bottom of the Personal tab, mirroring Add's grid layout:
- Row: Emergency Contact Name *, Emergency Contact Number *
- Row: Next of Kin Name *, Next of Kin Relationship *
- Row: Next of Kin Phone Number *, Next of Kin Email *
- Row (full-width): Next of Kin Address * (Textarea)

Bind to the existing `editEmployee` keys already set by `handleEditEmployee`: `emergencyContact`, `emergencyContactNumber`, `nextOfKinName`, `nextOfKinRelationship`, `nextOfKinPhone`, `nextOfKinEmail`, `nextOfKinAddress`. No initializer changes needed — `handleUpdateEmployee` already includes them in the PUT payload.

### 2. Job tab
- **Grade Level** → convert plain Input to required Select with options Junior / Middle / Senior / Executive.
- **Employment Type** → remove the "Intern" option; final options: Full-time / Contract / Part-time / Consultant.
- **Employment Status** → replace option list with Add's full seven: Active / On-Leave / Time-Off / On-board / Resigned / Terminated / Retired.
- **Vacation Days** → replace number Input with a Select for 7–20 days, bound to `vacation_days` (the key the save handler reads). Remove the dead `vacationDays` camelCase binding.
- Add `*` markers to Supervisor Name, Work Location, Probation Period labels (Hire Date and Probation Period already auto-calc Confirmation Date — keep that logic).

### 3. Financial tab
- **Bank Name** → replace plain Input with the same nationality-gated Select from Add (Nigerian / American / British / Other bank lists, gated by `editEmployee.nationality`).
- Auto-calc / readOnly behavior on Basic / Housing / Transport / Other allowances stays exactly as-is.

### 4. Gov IDs tab
- Add `*` to National ID (NIN) label and include it in the Edit validation pass.

### 5. Additional tab
- Remove only the stray `vacation_days` Input.
- Document uploader, current documents list, and all other UI here stay untouched.

### 6. Validation pass in `handleUpdateEmployee`
Add an `editFormErrors` map populated by required-field checks that mirror Add's `handleAddEmployee` checks for every field marked `*`:
- Personal: firstName, lastName, dateOfBirth, gender, maritalStatus, nationality, phoneNumber, email, homeAddress, emergencyContact, emergencyContactNumber, nextOfKinName, nextOfKinRelationship, nextOfKinPhone, nextOfKinEmail, nextOfKinAddress.
- Job: jobTitle, department, employment_type, grade_level, supervisor_name, work_location, hireDate, probationPeriod, employment_status.
- Financial: gross_salary.
- Gov IDs: national_id.

On failure: highlight offending fields (`border-destructive`), `setActiveTab` to the first tab containing an error, toast an error message — same UX as Add.

### 7. Pre-population
`handleEditEmployee` (lines ~1080–1110) already populates every relevant key from the loaded employee. Only confirmation needed: Vacation Days reads from `employee.vacation_days` into `editEmployee.vacation_days`. No initializer code changes required beyond a sanity check.

### 8. Documentation
Create `docs/edit-employee-form-fix.md` containing:
- Full Add vs Edit audit table (the tables above).
- Per-tab list of fixes applied.
- "Backend / API impact" section confirming **no backend changes required** — all fields already round-trip through `PUT /employees/{id}` via the existing `handleUpdateEmployee` payload mapping.

---

## Files touched
- `src/pages/Employees.tsx` — Edit dialog JSX (~lines 3362–4267) and `handleUpdateEmployee` validation block.
- `docs/edit-employee-form-fix.md` — new audit + fix doc.

## Explicitly out of scope
- snake_case ↔ camelCase state-key cleanup across Edit.
- Surfacing `mealAllowance`, `bankAccount`, contract-related fields (not rendered in Add either).
- Any change to the Additional tab's document uploader.
- Any backend / API change.
