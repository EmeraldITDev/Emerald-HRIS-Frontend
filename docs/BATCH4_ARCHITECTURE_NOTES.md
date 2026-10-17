# Batch 4 — Architecture notes (pre-implementation)

## Current state

- Single `performance_reviews` row per employee+period with separate JSON: `self_assessment`, `manager_review`, `hr_review`.
- HR creates one review via `POST /performance` (`createReview`); manager resolved by `getManagerId` (department / fuzzy supervisor_name).
- Reliable reporting fields available: `employees.supervisor_id` (+ `LineManagerResolver` for leave).
- Free-text `period` remains; Batches 1–3 ACL/sealing/draft/discussion unchanged.
- Narrative objective fields from Batch 3 are a temporary bridge.

## Proposed relationships

```
performance_review_cycles 1──* performance_review_cycle_employees
performance_review_cycles 1──* performance_reviews (nullable cycle_id; unique cycle_id+employee_id)
performance_reviews 1──* performance_objectives
performance_objectives 1──* performance_objective_changes (append-only)
```

Assessment results per objective stored inside existing assessment JSON as
`objective_assessments[]` (keeps Batch 1 sealing / Batch 3 merge behaviour).

## Permissions

- Cycles: HR admin create/update/preview/open only.
- Objectives: assigned review manager (or HR) create/amend; employee + assigned manager agree; scope = own review only.
- HOD flag stored; no HOD workflow. Reminder JSON stored; no scheduler claimed.

## Manager assignment for launch

Prefer `supervisor_id` → supervisor's User. Fallback: unique department line manager via `LineManagerResolver`. Never invent managers; block open when any roster row is `missing_manager` unless HR sets an explicit override on the roster.
