# Batch 4 Verification Evidence — Review Cycles & Structured Objectives

**Date:** 17 October 2026  
**Classification:** **Verified** (PHPUnit + Playwright executed successfully)  
**Scope:** Emerald Performance Review Batch 4 only. Batch 5 (HOD approval, reopening, finalisation gates, scheduled reminders) not started.

Architecture notes recorded before implementation: `docs/BATCH4_ARCHITECTURE_NOTES.md`.

---

## 1. Initial architecture findings

- Reviews remain a single `performance_reviews` row with separate `self_assessment` / `manager_review` / `hr_review` JSON (Batches 1–3 preserved).
- HR previously created reviews one-at-a-time via `POST /performance`; manager assignment used `getManagerId` (department / fuzzy supervisor name).
- Reliable reporting field available: `employees.supervisor_id`.
- Free-text `period` retained for legacy rows; no cycle entity existed.
- Batch 3 narrative objective fields were a temporary bridge only.

---

## 2. New database entities and relationships

| Table | Purpose |
|---|---|
| `performance_review_cycles` | Configurable cycle (dates, eligibility, HOD flag, reminder config, status) |
| `performance_review_cycle_employees` | Roster with resolved/overridden manager, assignment status, linked review |
| `performance_reviews.cycle_id` | Nullable FK; unique `(cycle_id, employee_id)` when set |
| `performance_objectives` | Structured objectives per review + dual agreement timestamps |
| `performance_objective_changes` | Append-only material change history |

Migration: `hris-backend/database/migrations/2026_10_17_210000_create_performance_review_cycles_and_objectives.php` (reversible).

Per-objective **assessment answers** live in assessment JSON as `objective_assessments[]` so Batch 1 sealing and Batch 3 merge behaviour stay intact.

---

## 3. Cycle administration implemented

- HR CRUD for cycles (name, period label, coverage and deadline dates, departments/employee IDs, template, rating scale, HOD flag, reminder schedule JSON, escalation contact).
- Date validation rejects inverted coverage or deadline order.
- Preview builds roster using `supervisor_id` first, then unique department line manager; flags `missing_manager` / `conflict`; HR can override manager.
- Open creates `self_assessment_requested` reviews linked to the cycle; retry is idempotent (no duplicates).
- **No hardcoded June/July/December/January** — all dates are HR-configured.
- **HOD flag stored only** — workflow explicitly documented as Batch 5 / not operational.
- **Reminder schedule stored only** — execution not claimed.

UI: `/performance/cycles` (`PerformanceCycles.tsx`), linked from Performance for HR.

---

## 4. Objectives agreement and change history

- Manager/HR create proposed objectives (title, measure, target, due date, support).
- Agreement requires **both** employee and assigned manager `agree` calls; `is_agreed` is false until both timestamps exist.
- After agreement, ordinary `PUT` is blocked; material changes use `amend` with required reason → append-only history (previous/new values, changer, optional change-agreed date).
- History has no ordinary update/delete API.
- Unassigned managers and peers receive 403.
- Creating/amending objectives does not alter assessment JSON or advance status.

---

## 5. Files / routes / models changed

### Backend

- Controllers: `PerformanceReviewCycleController.php`, `PerformanceObjectiveController.php`; updates to `PerformanceReviewController.php` (objectives on show, objective rating validation, `can_manage_objectives`)
- Models: `PerformanceReviewCycle`, `PerformanceReviewCycleEmployee`, `PerformanceObjective`, `PerformanceObjectiveChange`; `PerformanceReview` relations
- Service: `PerformanceCycleManagerResolver.php`
- Routes: `routes/api-routes.php` (`/performance/cycles…`, `/{id}/objectives…`)
- Tests: `PerformanceReviewCycleAdministrationTest.php`, `PerformanceObjectiveWorkflowTest.php`
- E2E prepare: `scripts/e2e_batch1_prepare.php` (supervisor_id + objectives review)

### Frontend

- `src/pages/PerformanceCycles.tsx`, route in `App.tsx`
- `PerformanceReviewDetail.tsx` — objectives panel + per-objective manager ratings
- `Performance.tsx` — cycle admin link; self-assessment shows linked objectives
- `src/lib/api.ts` — cycle + objective API methods
- `e2e/batch4-cycles-objectives.spec.ts`, helpers, `package.json` scripts

---

## 6. Historical review preservation

- Legacy reviews keep `cycle_id = null` and free-text `period`.
- Narrative Batch 3 fields remain readable.
- Empty `objectives` array + `legacy_without_objectives` flag when listing objectives on non-cycle reviews.
- No production reseed; migration is additive.

---

## 7. PHPUnit results

```bash
cd hris-backend
./.tools/php vendor/bin/phpunit --filter='PerformanceReviewCycleAdministrationTest|PerformanceObjectiveWorkflowTest|PerformanceReviewIndependenceTest|PerformanceReviewDiscussionAcknowledgementTest|PerformanceReviewFormsRatingsDraftTest'
```

**Result:** `OK` — **40 tests, 275 assertions** (Batches 1–4).

---

## 8. Playwright results

```bash
cd emerald-people-flow-nigeria
npm run test:e2e:batch4
# combined:
npm run test:e2e:performance
```

**Batch 4 alone:** **6/6 passed**  
**Combined Batches 1–4:** **29/29 passed** (9 + 6 + 8 + 6).

---

## 9. Regression (Batches 1–3)

| Suite | Result |
|---|---|
| Independence (Batch 1) | Pass |
| Discussion / acknowledgement (Batch 2) | Pass |
| Forms / ratings / drafts (Batch 3) | Pass |
| Playwright Batches 1–3 | Pass within combined 29/29 |

Sealing, assigned-manager ACL, draft non-advancement, discussion/ack independence, §7 ratings / N/A rules remain intact. Objective master records stay visible while assessment payloads remain sealed until manager submit.

---

## 10. Incomplete / policy / blocked

| Item | Status |
|---|---|
| HOD approval workflow | Flag only — Batch 5 |
| Scheduled reminder execution | Config JSON only — later infrastructure |
| HR reopening / enhanced finalisation | Out of scope (Batch 5) |
| Weighted / automatic overall ratings | Explicitly not implemented |
| Chromium form-fill create on cycle UI | API create + UI list/detail verified; controlled date inputs flaky under Playwright fill — API path is authoritative |

**Agreement policy decision:** dual confirmation (employee + assigned manager). An objective is not “agreed” from create/display alone.

---

## 11. Remaining production-readiness risks

- Department-wide cycle open still depends on complete `supervisor_id` / roster overrides before launch.
- Reminder and HOD features must not be presented as live until Batch 5+ infrastructure exists.
- Legacy fuzzy `getManagerId` on single-review create remains for backward compatibility; cycle launch uses the stricter resolver.
- Full module is **not** production-ready at end of Batch 4.

---

## Classification

**Batch 4: Verified**

Do **not** declare the complete Performance Review module production-ready. Proceed to Batch 5 when scheduled.
