# Edit Employee Form — Full Field Parity with Add Employee

## Goal
Bring the Edit Employee dialog (`src/pages/Employees.tsx`) to full visual and behavioral parity with the Add Employee dialog: same fields, same input types, same options, same required-field markers, same validation pass.

## Backend / API impact
**None.** Every field added or fixed already round-trips through `PUT /employees/{id}` via the existing `handleUpdateEmployee` payload mapping (`emergency_contact_*`, `next_of_kin_*`, `grade_level`, `employment_type`, `employment_status`, `vacation_days`, `bank_name`, `national_id`). No new API contract is required.

## Audit — Add vs Edit (all 5 tabs)

### Personal
| Field | Add | Edit (before) | Status |
|---|---|---|---|
| First Name * | Input | Input | PRESENT |
| Middle Name | Input | Input | PRESENT |
| Last Name * | Input | Input | PRESENT |
| Date of Birth * | DateInput | DateInput | PRESENT (validation gap) |
| Gender * | Select | Select | PRESENT |
| Marital Status * | Select | Select | PRESENT |
| Nationality * | Select | Select | PRESENT |
| Phone Number * | Input | Input | PRESENT |
| Email * | Input | Input | PRESENT |
| Home Address * | Textarea | Textarea (no `*`) | PRESENT (validation gap) |
| Emergency Contact Name * | Input | — | MISSING |
| Emergency Contact Number * | Input | — | MISSING |
| Next of Kin Name * | Input | — | MISSING |
| Next of Kin Relationship * | Input | — | MISSING |
| Next of Kin Phone * | Input | — | MISSING |
| Next of Kin Email * | Input | — | MISSING |
| Next of Kin Address * | Textarea | — | MISSING |

### Job Info
| Field | Add | Edit (before) | Status |
|---|---|---|---|
| Job Title * | Input | Input | PRESENT |
| Department * | Select | Select | PRESENT |
| Employment Type * | Select (4 opts) | Select (5 opts: extra Intern) | MISMATCH |
| Grade Level * | Select (4 opts) | plain Input | MISMATCH |
| Supervisor Name * | Input | Input (no `*`) | PRESENT (validation gap) |
| Work Location * | Input | Input (no `*`) | PRESENT (validation gap) |
| Hire Date * | DateInput | DateInput | PRESENT |
| Probation Period * | Select | Select (no `*`) | PRESENT (validation gap) |
| Confirmation Date (auto) | readOnly Input | readOnly Input | PRESENT |
| Employment Status | Select (7 opts) | Select (5 opts) | MISMATCH |
| Vacation Days | Select 7–20, bound to `vacation_days` | number Input bound to `vacationDays` + duplicate Input in Additional | MISMATCH |

### Financial
| Field | Add | Edit (before) | Status |
|---|---|---|---|
| Gross Salary (Annual) * | Input | Input | PRESENT |
| Basic / Housing / Transport / Other Allowance | readOnly auto-calc | readOnly auto-calc | PRESENT (untouched) |
| Bank Name | nationality-gated Select | plain Input | MISMATCH |
| Account Number / NUBAN / Sort Code | Input | Input | PRESENT |

### Gov IDs
| Field | Add | Edit (before) | Status |
|---|---|---|---|
| Employee ID | disabled Input | disabled Input | PRESENT |
| National ID (NIN) * | Input | Input (no `*`) | PRESENT (validation gap) |
| Passport, BVN, TIN, Pension PIN, NHF, Tax ID | Input | Input | PRESENT |

### Additional
| Field | Add | Edit (before) | Status |
|---|---|---|---|
| Documents (7 categories) | per-category file pickers | unified type-selector + uploader + current docs list | KEEP AS-IS (per scope) |
| Vacation Days | not present | duplicate number Input | REMOVED |

## Fixes applied

### Personal tab
- Added the Emergency Contact & Next of Kin section (7 inputs) at the bottom of the tab, mirroring Add's grid layout. All bound to existing `editEmployee` keys (`emergencyContact`, `emergencyContactNumber`, `nextOfKinName`, `nextOfKinRelationship`, `nextOfKinPhone`, `nextOfKinEmail`, `nextOfKinAddress`) that are already populated by `handleEditEmployee`.
- Added `*` marker to Home Address label.

### Job tab
- Grade Level: converted plain Input to required Select with `gradeLevels` (Junior / Middle / Senior / Executive).
- Employment Type: removed the "Intern" option (Full-time / Contract / Part-time / Consultant only).
- Employment Status: replaced options with Add's seven (Active / On-Leave / Time-Off / On-board / Resigned / Terminated / Retired).
- Vacation Days: replaced number Input with a Select for 7–20 days, bound to `vacation_days` (the key the save handler reads).
- Added `*` markers to Supervisor Name, Work Location, and Probation Period.

### Financial tab
- Bank Name: replaced plain Input with the nationality-gated Select used in Add (Nigerian / American / British / Other bank lists, gated by `editEmployee.nationality`).
- Auto-calc readOnly fields untouched.

### Gov IDs tab
- Added `*` marker to National ID (NIN) and included it in the validation pass.

### Additional tab
- Removed the stray duplicate Vacation Days Input.
- Document uploader and current documents list left exactly as-is.

### Validation pass
- Added `editFormErrors` and `editActiveTab` state.
- Edit dialog Tabs converted to controlled (`value={editActiveTab}`) so failed validation can jump to the offending tab.
- `handleUpdateEmployee` now runs a required-field check (mirroring `handleAddEmployee`) for every `*` field across Personal, Job, Financial, and Gov IDs tabs. On failure: offending inputs get `border-destructive`, the dialog switches to the first tab containing an error, and a toast is shown — same UX as Add.
- `handleEditEmployee` resets `editFormErrors` and `editActiveTab` whenever the dialog opens.

## Pre-population
All fields are populated from the saved employee record by `handleEditEmployee` (no initializer changes needed). Vacation Days reads from `employee.vacation_days` into `editEmployee.vacation_days`.

## Explicitly out of scope
- snake_case ↔ camelCase state-key cleanup.
- Surfacing `mealAllowance`, `bankAccount`, or contract-related fields (not present in Add either).
- Any change to the Additional tab's document uploader.
- Any backend / API change.