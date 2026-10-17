# Emerald HRIS Performance Review — Audit Report (Phases 1–4)

**Date:** 2026-10-17  
**Scope:** Frontend `emerald-people-flow-nigeria` + Backend `hris-backend` only  
**Requirements source:** *Emerald Integrated Performance Management & HRIS Guide*  
**Evidence type:** Code inspection only (no running-app / Playwright verification yet)  
**Status of this document:** Pre-implementation audit. Behaviour labelled **Unverified** until Playwright or live testing confirms it.

---

## 1. Current architecture and data flow

### High-level design

The module is a **single-table, sequential workflow** — not a multi-entity cycle/objectives/HOD system.

```
HR creates review (employee + period string)
  → status: self_assessment_requested
  → notify employee

Employee saves/submits self_assessment JSON
  → status: self_assessment_submitted
  → notify assigned manager

Manager submits manager_review JSON
  → status: hr_review  (skips writing "manager_review" status)
  → notify HR

HR completes hr_review JSON
  → status: completed
  → notify employee

Employee sign-off (frontend calls /sign; backend currently rejects legacy sign)
```

### Frontend (live paths)

| Path | File | Role |
|------|------|------|
| `/performance` | `src/pages/Performance.tsx` | List, HR “New Review”, self-assessment dialog |
| `/performance/:id` | `src/pages/PerformanceReviewDetail.tsx` | Manager + HR structured forms, stage strip, sign-off |

Supporting: `src/lib/api.ts` (performance API methods), `src/utils/performanceReviewPdf.ts`, sidebar + dashboard links.

**Orphan / unused from routes:** `src/components/PerformanceReviewForm.tsx` (KPA/competency form not wired). Several list-page dialogs (`view` / `comment` / `manage` / HR) appear unreachable because `setSelectedReview` is never called.

### Backend

| Layer | Path |
|-------|------|
| Routes | `hris-backend/routes/api-routes.php` → `/performance` and `/api/performance` |
| Controller | `app/Http/Controllers/PerformanceReviewController.php` |
| Model | `app/Models/PerformanceReview.php` |
| Mail | `app/Mail/PerformanceReviewNotice.php` |
| Migrations | `2025_10_29_120000_create_performance_reviews_table.php`, `2026_09_21_130000_redesign_performance_review_statuses.php` |

**Not present:** dedicated Services / Form Requests / Policies / Cycle model / Objectives model / HOD workflow / Audit table for reviews / Factories / PHPUnit coverage / Playwright config in frontend.

### Persistence

Table `performance_reviews`:

- Keys: `employee_id`, `manager_id`, free-text `period`
- Status (post-redesign): `draft` \| `self_assessment_requested` \| `self_assessment_submitted` \| `manager_review` \| `hr_review` \| `completed`
- Assessments as JSON: `self_assessment`, `kpis`, `manager_review`, `hr_review`
- Legacy columns still present: `meeting_at`, `meeting_notes`, signature timestamps — workflow endpoints for meeting/sign **reject with 422**

---

## 2. Existing workflow and actual review states

### Statuses as coded

| System status | How entered | Notes |
|---------------|-------------|-------|
| `draft` | Enum default / legacy | Create path does not use it |
| `self_assessment_requested` | HR `createReview` | |
| `self_assessment_submitted` | Employee `submitSelfAssessment` | |
| `manager_review` | Accepted for manager edit | **Never written** by current manager submit (jumps to `hr_review`) |
| `hr_review` | Manager `managerReview` | |
| `completed` | HR `complete` / `approve` / `close` | |

### vs HR guide Section 10

| HR status | Current mapping | Classification |
|-----------|-----------------|----------------|
| Cycle not yet open | Missing (no cycle entity) | Missing |
| Objectives in progress / agreed | Missing | Missing |
| Employee self-assessment in progress | Approx. `self_assessment_requested` | Partial |
| Employee self-assessment submitted | `self_assessment_submitted` | Partial (implemented) |
| Manager assessment in progress | `manager_review` listed but unused | Defective / dead |
| Manager assessment submitted | Implied by `hr_review` | Partial |
| Discussion pending / completed | Missing (endpoints 422) | Missing |
| HOD approval pending | Missing | Missing |
| HR check pending | `hr_review` | Partial |
| Finalised | `completed` | Partial |
| Returned / reopened | Only early-status overwrite on recreate | Missing |

Transitions are **partially enforced** in the controller (status checks on each action). There is no general state machine or reopen-with-reason path for submitted reviews.

---

## 3. Requirements coverage matrix

| Req ID | HR requirement | Current implementation | Evidence | Gap / risk | Priority | Recommended change | Verification |
|--------|----------------|------------------------|----------|------------|----------|--------------------|--------------|
| R-CYC-01 | HR configures cycle name, period, dates, deadlines without code changes | Free-text `period` only on create; no dates/deadlines/eligibility | `createReview` validates `employee_id`, `period` only | Missing cycle admin | Critical | Add `review_cycles` (or equivalent) with dates + flags; link reviews to cycle | Playwright A: HR opens/configures cycle; persists after reload |
| R-CYC-02 | Eligible employees, managers, template, HOD flag, reminders | Manager auto-assigned heuristically; no HOD/reminder schedule | `getManagerId()` in controller | Missing | Critical | Cycle eligibility + manager assignment + HOD toggle + reminder jobs | Playwright A |
| R-OBJ-01 | Agree/record objectives with measures, targets, dates, support | No objectives entity; KPIs JSON optional / lightly used | No objectives routes/models; `kpis` column only | Missing | Critical | Objectives CRUD + history of material changes | Playwright B |
| R-OBJ-02 | Material changes retain history + agreed date | Not implemented | — | Missing | High | Append-only objective change log | Playwright B |
| R-IND-01 | Manager cannot see employee ratings/comments until manager submits | **GET returns full `self_assessment` to managers**; UI shows it on detail step 0; form asks accuracy of self-rating | `show`/`index` return full model; `PerformanceReviewDetail` `ReadOnlyBlock` of `self_assessment`; `self_assessment_accuracy` field | **Implemented but defective** (opposite of guide) | Critical | Server-side redact until manager submitted; remove accuracy-of-self field from independent phase; FE hide | Playwright D + API negative tests |
| R-IND-02 | Employee cannot see manager assessment before manager submits | Manager JSON empty until submit — usually OK; no explicit redact helper | Empty `manager_review` until submit | Partially implemented / Unverified at runtime | Critical | Explicit redact of `manager_review` for employee until submitted | Playwright D |
| R-IND-03 | Separate records; one must not overwrite the other | Separate JSON columns on same row | Model casts | Partially implemented | Critical | Keep columns separate; never merge on write | Unit + E2E |
| R-SELF-01 | Self-assessment questions per Section 5 | Different 16-question dialog; rating labels Poor→Excellent | `Performance.tsx` self-assessment dialog | Partial / wrong scale | High | Align questions + draft save; use guide rating labels | Playwright C |
| R-SELF-02 | Save draft, return, submit; lock after submit | `storeSelfAssessment` saves without status change; submit locks by status | Controller `storeSelfAssessment` / `submitSelfAssessment` | Partial (no FE draft resume UX/local persistence) | High | Wire draft save UI; load draft on reopen | Playwright C |
| R-MGR-01 | Manager form per Section 6 (objectives, behaviours, PIP, discussion) | Short schema: performance_assessment, accuracy, strengths, gaps, recommendations, rating | `MANAGER_REVIEW_KEYS` + detail form | Partial | High | Expand fields; keep simple (no weights) | Playwright D/E |
| R-RATE-01 | Scale: Exceptional … Does Not Meet + N/A with explanation | FE: Poor/Fair/Good… or unlabeled 1–5; no N/A | `Performance.tsx`, detail selects | Defective vs guide | High | Single shared scale + N/A validation | Playwright C/D |
| R-RATE-02 | No forced distribution / no unapproved weighted formula | No weighting found | Code search | Implemented (by absence) — preserve | Medium | Do not add weights | Code review |
| R-DISC-01 | Discussion record, acknowledgement ≠ agreement, disagreement | Sign/discussed endpoints return 422; no disagreement fields | Controller `sign` / `markDiscussed` | Missing / defective | Critical | Re-enable discussion + acknowledgement + disagreement with audit | Playwright E |
| R-HOD-01 | Optional HOD approval/calibration; rating changes need reason + audit | No HOD role/workflow | — | Missing | High | Cycle flag + HOD step + audit on rating change | Playwright F |
| R-HR-01 | HR quality checks before finalise; block if steps incomplete | HR can complete from `hr_review` with light content checks; no checklist of objectives/discussion/ack | `complete()` | Partial | High | Gate finalisation on required steps | Playwright F |
| R-HR-02 | Only HR reopens submitted reviews with reason + history | Recreate only for early statuses; no reopen reason/history | `createReview` conflict rules | Missing | High | HR-only reopen endpoint + audit | Playwright F |
| R-ACL-01 | Employee own records only | Employee list filtered by `employee_id` | `index` else branch | Partially implemented | Critical | Keep + Playwright H | Playwright H |
| R-ACL-02 | Managers: direct reports / authorised scope only | Line managers also see **entire department** | `authorizeView` / `index` dept OR | **Defective** (over-broad) | Critical | Restrict to `manager_id` (or explicit reporting graph) unless HR confirms dept scope | Playwright H |
| R-ACL-03 | HOD scoped access | No HOD | — | Missing | High | Add with least privilege | Playwright H |
| R-DASH-01 | Counts due/in progress/submitted/overdue/finalised | Dashboard only “pending” chip; Reports performance stub N/A | `Dashboard.tsx`; `ReportController` stub | Missing / defective | Medium | Real counts from `performance_reviews` for active cycle | Playwright G |
| R-AUD-01 | Audit trail of submissions, edits, rating changes, reopen, finalise | No performance audit log writes | Controller has notifications only | Missing | Critical | Audit log table or reuse existing audit service | Playwright G |
| R-NOT-01 | Notifications and deadline reminders | Create/submit/manager/complete notifications + email | `NotificationService` + mail | Partial (no deadline reminders) | Medium | Reminder schedule on cycle | Manual + later E2E |
| R-TEST-01 | IT completion checklist / E2E | No Playwright in frontend; no PHPUnit for performance | `package.json`; `tests/` | Missing | Critical | Add Playwright suite per Phase 6 | Full suite |

---

## 4. Confirmed defects and missing features (code inspection)

### Critical defects

1. **Independent assessment rule inverted** — managers receive and UI displays full `self_assessment` before manager submission; manager form asks whether self-rating is accurate.
2. **Over-broad manager access** — any `line_manager` in the same department can view/act on reviews not assigned to them.
3. **Discussion / acknowledgement API broken** — `/sign`, `/discussed`, `/schedule-meeting` return 422 while frontend still calls `/sign`.
4. **No audit trail** for rating changes, reopen, or finalisation.

### Missing (MVP Phase 1 of HR guide)

- Review cycle administration entity (dates, eligibility, HOD flag, reminders)
- Objectives agreement + change history
- HOD approval / calibration
- Disagreement + acknowledgement-as-receipt semantics
- HR return/reopen-with-reason
- Dashboard/reporting against real data
- Playwright + backend feature tests

### Partial / inconsistent

- Status `manager_review` never set on submit
- Dual/conflicting rating label sets across UI surfaces
- Self-assessment questions ≠ Section 5
- Manager/HR forms ≠ Section 6
- List-page legacy dialogs dead; detail page is live path
- `PerformanceReviewForm.tsx` orphaned
- Frontend TypeScript status union outdated vs redesigned statuses

---

## 5. Security and data-integrity risks

| Risk | Severity | Evidence |
|------|----------|----------|
| Manager reads employee self-assessment (incl. drafts) via API before submitting | Critical | `show`/`index` return full JSON after `authorizeView` |
| Same-department line manager can view non-direct reports | High | `authorizeView` department match |
| Employee may see manager/HR JSON once present (no staged reveal for discussion rules) | High | Full model on `show` |
| Finalisation without discussion/acknowledgement | High | `complete` only checks `hr_review` status + content |
| Ops endpoint `POST /performance/fix-managers` left in routes | Medium | api-routes comment “remove after running” |
| No audit of who changed ratings | High | No audit writes |
| Self-assessment validation mostly nullable | Medium | Weak required-field enforcement |

---

## 6. Functionality to preserve

- Single `performance_reviews` row with separate JSON for self / manager / HR (do not collapse into one blob).
- Existing status vocabulary (`self_assessment_requested` → … → `completed`) — extend rather than wholesale rename where possible.
- HR-only create; employee-only self submit; HR-only complete.
- Sanctum auth on all performance routes.
- In-app + email notifications on key transitions.
- Detail page multi-step UX (`/performance/:id`) as the primary manager/HR surface.
- No weighted rating formula (aligns with Section 12).
- Existing unrelated HRIS modules (leave, payroll, training, etc.) — out of scope.

---

## 7. HR policy decisions requiring clarification

| # | Topic | Guide references | Operational impact | Safest interim behaviour | Release blocker? |
|---|--------|------------------|--------------------|--------------------------|------------------|
| P1 | Confidential review access | §3 HOD access vs §12 “HR & Line manager” for sensitive reviews | Who sees confidential cases | **Least privilege:** only assigned line manager + HR; do not broaden HOD access until confirmed | Yes for HOD rollout |
| P2 | Reopening submitted reviews | §12 HR only | Who can unlock after submit | **HR-only reopen** with mandatory reason + retained history | Yes for correction workflow |
| P3 | Overall rating method | §12 manager judgement; weights later | Whether to compute scores | **Manager judgement only; no weights** | No — already safe |
| P4 | Exact cycle dates (Jun/Jul, Dec/Jan) + objective-setting schedule | §12 | Cycle configuration defaults | Allow HR to set dates in UI; **do not hardcode** Emerald calendar | Blocks cycle go-live dates only |
| P5 | Department-wide vs direct-report manager scope | §9 “authorised reporting scope” | Current code uses whole department | **Default to assigned `manager_id` only** until HR confirms department scope | Yes for pilot ACL |

---

## 8. Prioritised remediation plan

### Batch 1 — Access control & assessment independence (Critical)
**Problem:** API + UI expose peer assessments incorrectly; department-wide manager access.  
**Change:** Server-side response filtering; tighten manager auth to assigned manager (policy interim); FE hide sealed fields; stop requiring `self_assessment_accuracy` during independent phase.  
**Files:** `PerformanceReviewController.php`, `PerformanceReviewDetail.tsx`, possibly `api.ts`.  
**Verify:** API returns redacted payloads; Playwright D/H.

### Batch 2 — Discussion, acknowledgement, disagreement (Critical)
**Problem:** Sign/discussed rejected; no disagreement semantics.  
**Change:** Re-enable endpoints with guide semantics; store acknowledgement ≠ agreement; disagreement flag + text.  
**Files:** Controller, model/migration if new columns, detail + list UI.  
**Verify:** Playwright E.

### Batch 3 — Forms, rating scale, drafts (High)
**Problem:** Questions and scale diverge from §§5–7; draft UX weak.  
**Change:** Align field schemas; shared rating constants (incl. N/A); draft save/resume.  
**Files:** `Performance.tsx`, detail forms, controller validation.  
**Verify:** Playwright C/D.

### Batch 4 — Cycle admin + objectives (Critical for guide MVP)
**Problem:** No cycle entity or objectives workflow.  
**Change:** Minimal `review_cycles` + objectives tables/APIs; wire HR UI.  
**Files:** New migrations/models/controllers; Performance admin UI.  
**Verify:** Playwright A/B.

### Batch 5 — HOD optional path + HR finalisation gates + reopen (High)
**Problem:** No HOD; weak finalise/reopen.  
**Change:** Cycle `requires_hod_approval`; audit on rating change; HR reopen; block complete if incomplete.  
**Verify:** Playwright F.

### Batch 6 — Dashboard, audit log, notifications reminders (Medium)
**Problem:** Stub reports; no audit; no reminders.  
**Change:** Real aggregates; audit writers; optional reminder job.  
**Verify:** Playwright G.

### Batch 7 — Playwright suite + backend feature tests (Critical for readiness)
**Problem:** Zero automated coverage for this module.  
**Change:** Introduce Playwright (frontend) + PHPUnit feature tests (backend) for A–I scenarios.  
**Verify:** CI / local suite green against test env.

---

## 9. Playwright test plan (mapped to requirements)

| Scenario | Maps to | Precondition |
|----------|---------|--------------|
| A Cycle setup | R-CYC-* | Test HR account; empty/test cycle |
| B Objectives | R-OBJ-* | Cycle open; employee+manager pair |
| C Employee self-assessment | R-SELF-* | Review in `self_assessment_requested` |
| D Independent manager assessment | R-IND-* | Employee submitted; assert API redaction before manager submit |
| E Discussion & acknowledgement | R-DISC-* | Both assessments submitted |
| F HOD / HR finalisation | R-HOD-*, R-HR-* | Cycles with HOD on/off |
| G Dashboard & records | R-DASH-*, R-AUD-* | Seeded fixture set |
| H Access-control negatives | R-ACL-* | Cross-role tokens; direct URL + API |
| I Persistence / reliability | R-SELF-02, integrity | Reload, re-login, duplicate submit |

**Current state:** No Playwright dependency or specs in `emerald-people-flow-nigeria`. Backend has PHPUnit but **no** performance tests. Suite must be introduced before claiming production readiness.

**Test accounts:** Use only authorised test-environment credentials; never log secrets.

---

## 10. Classification summary (Phase 1 verdict)

| Area | Classification |
|------|----------------|
| Basic create → self → manager → HR → completed happy path | Partially implemented (code path exists; runtime Unverified) |
| Independent dual assessment | **Implemented but defective** |
| Objectives | Missing |
| Cycle administration | Missing |
| Guide-aligned forms & rating scale | Partially implemented / defective labels |
| Discussion / acknowledgement / disagreement | Missing / defective (422) |
| HOD / calibration | Missing |
| HR reopen + audit | Missing |
| Dashboard / reports | Missing / stub |
| Access control (employee own; manager scope) | Partially implemented / manager scope defective |
| Automated E2E | Missing |

**Production-readiness (pre-fix):** **Not ready** for department pilot. Highest blockers: assessment independence leak, over-broad manager ACL, missing discussion/ack, missing cycle/objectives for guide MVP, zero E2E proof.

---

## 11. Implementation progress

### Batch 1 — Access control & assessment independence (in progress / code changed)

**Problem:** API returned full `self_assessment` to managers before they submitted; same-department line managers could access non-assigned reviews; manager form asked about self-rating accuracy (contradicts independence).

**Correction implemented (code inspection; runtime/Playwright still pending):**

| Change | Location |
|--------|----------|
| Server-side sealing via `presentReviewForViewer` / `assessmentVisibility` | `hris-backend/app/Http/Controllers/PerformanceReviewController.php` |
| Index + show return sealed payloads | same |
| Manager list/view/act limited to assigned `manager_id` (policy P5 interim) | `index`, `authorizeView`, `authorizeManager` |
| Manager notification no longer implies reading self-assessment first | `submitSelfAssessment` notify/email copy |
| Form schema drops `self_assessment_accuracy` for independent phase | `show` `form_schema` |
| Detail UI sealed messaging + guide rating labels + independent manager questions | `emerald-people-flow-nigeria/src/pages/PerformanceReviewDetail.tsx` |
| Feature tests added | `hris-backend/tests/Feature/PerformanceReviewIndependenceTest.php` |

**Verification criteria:**
1. Manager `GET /performance/{id}` while status=`self_assessment_submitted` → `self_assessment` null + `self_assessment_sealed` true (no secret strings in body).
2. After manager submit → self-assessment visible to manager; employee sees manager assessment; employee does not see `hr_review` until `completed`.
3. Non-assigned same-department line manager → 403.
4. PHPUnit `PerformanceReviewIndependenceTest` green.
5. Playwright D/H (not yet present in repo).

**Blocker:** Local environment has no `php` binary; PHPUnit not executed in this session. Playwright not yet installed in frontend.

---

## 12. Next step

Continue Batch 2 (discussion / acknowledgement / disagreement) after Batch 1 verification is unblocked, or install PHP/Playwright to close Batch 1 verification first.
