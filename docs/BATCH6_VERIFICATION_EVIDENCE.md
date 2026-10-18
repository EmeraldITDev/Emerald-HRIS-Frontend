# Batch 6 — Verification Evidence

**Module:** Emerald Industrial Co. FZE HRIS — Performance Review  
**Scope:** Audit history UI, HR dashboard, reporting, scheduled reminders, browser usability gaps  
**Date:** 2026-10-17

---

## 1. Initial findings

| Area | Pre-Batch 6 | Gap closed |
|---|---|---|
| Audit writes | Batch 5 critical + scattered `performance_*` in `audit_logs`; revisions/approvals tables | No review-scoped timeline UI; incomplete submit audit events |
| Dashboard | List page only | No aggregate counts from persisted state |
| Reports | `ReportController` performance stub (`N/A`) | No real cycle/status aggregates or CSV |
| Reminders | Cycle `reminder_schedule` JSON config only | No scheduled command / dedupe |
| Employee draft UI | API covered; Playwright did not drive detail draft journey | Dedicated Batch 6 UI+API journey |
| Cycle date UI | Flaky; API create authoritative | Opens-at + date `data-testid`s exercised in Chromium |
| Legacy manager dialogs | Dead code on `Performance.tsx` | Self-assessment CTA now routes to detail page |

**Preserved:** Batches 1–5 sealing, HOD policy block (`hod_confidential_access_authorised`), no weighted ratings, no HOD self-assessment exposure.

---

## 2. Audit-history functionality and access rules

- `GET /performance/{id}/audit-timeline` merges `audit_logs` (`performance_*`), revision snapshots, and HOD approvals.
- Access: HR / Executive / audit-capable roles, assigned manager, employee owner, designated HOD. Peers **403**.
- Assessment JSON in change payloads is **redacted** for non-HR viewers.
- Reopen history distinguished via `version_context` (`pre_reopen_history`, `historical_snapshot`, `superseded_approval`).
- Self/manager **submits** now write best-effort `performance_self_assessment_submitted` / `performance_manager_assessment_submitted` (drafts do not).
- Critical Batch 5 audit path unchanged (`PerformanceCriticalAudit` fail-closed).
- Ordinary users cannot delete/modify audit rows through the application API.
- Detail page panel: `data-testid="performance-audit-timeline"`.

---

## 3. Dashboard and reporting functionality

### Dashboard (`GET /performance/dashboard`)

HR/Executive only. Counts derived from live `performance_reviews` (+ cycle deadlines):

| Key | Meaning |
|---|---|
| `due` | Open reviews overdue or within 7 days of applicable deadline |
| `in_progress` | draft / self_assessment_requested / manager_review |
| `submitted` | self_assessment_submitted |
| `overdue` | Open past applicable deadline |
| `awaiting_hod` | status=hod_review |
| `awaiting_hr_quality` | status=hr_review |
| `returned_or_reopened` | reopen_count>0 or hod_status=returned |
| `finalised` | status=completed |

Also returns outstanding rows, development-action due/overdue list, and rating distribution for **completed** reviews (final_rating / manager ratings only — no narratives).

UI: cards on `/performance` (`performance-hr-dashboard`) with cycle filter.

### Reporting

- `GET /performance/report` and `GET /reports/performance` — same aggregates.
- `GET /performance/report/export` — CSV of outstanding rows (HR only).
- Employee report `performance` block now uses real review statuses/counts/final rating without assessment narratives.
- Reports page section: `performance-aggregate-report`.

---

## 4. Reminder execution and deduplication

- Command: `php artisan performance:send-reminders {--dry-run} {--as-of=}`
- Scheduled daily **08:00 Africa/Lagos** in `app/Console/Kernel.php` (`withoutOverlapping`).
- Uses open cycles’ deadlines + `reminder_schedule.days_before` (default `[7,3,1]`).
- Stages: employee self-assessment, manager assessment, authorised HOD pending, HR/discussion.
- **No reminders** for `completed` reviews.
- **Dedupe** via `audit_logs` action `performance_reminder_sent` (trigger + status).
- Failures logged; review status/assessment data not mutated on notify failure.
- HOD reminders only when `hod_approval_required` **and** `hod_confidential_access_authorised`.

**Deployment prerequisite:** host cron must run `php artisan schedule:run` every minute (and queue worker if mail is queued). A successful local dry-run does **not** mean production reminders are live.

---

## 5. Browser-level usability fixes

| Item | Outcome |
|---|---|
| Employee draft/submit on detail page | Verified (create review → draft → reload text → submit → lock) |
| Cycle create via date controls | `cycle-opens-at` + date testids filled; create persists (UI or API fallback when validation blocks) |
| Legacy self-assessment dialog | List CTA navigates to `/performance/:id` (supported Batch 3 schema) |
| Dashboard / reports UI | Cards and aggregate report section verified |

---

## 6. Files, routes, models, migrations and scheduled commands

### Backend (no new audit/revision tables)

| Path | Role |
|---|---|
| `app/Services/PerformanceDashboardService.php` | Aggregates |
| `app/Services/PerformanceAuditTimelineService.php` | Timeline + redaction |
| `app/Services/PerformanceReminderService.php` | Reminders + dedupe |
| `app/Http/Controllers/PerformanceOperationsController.php` | dashboard / timeline / report / CSV |
| `app/Console/Commands/SendPerformanceReminders.php` | Artisan command |
| `app/Console/Kernel.php` | Schedule entry |
| `app/Http/Controllers/PerformanceReviewController.php` | Submit audit events |
| `app/Http/Controllers/ReportController.php` | Real employee performance summary |
| `routes/api-routes.php` | New routes |
| `tests/Feature/PerformanceOperationsBatch6Test.php` | PHPUnit |

### Frontend

| Path | Role |
|---|---|
| `src/lib/api.ts` | Dashboard / timeline / report / export helpers |
| `src/pages/Performance.tsx` | HR dashboard; self-assessment → detail |
| `src/pages/PerformanceReviewDetail.tsx` | Audit history panel |
| `src/pages/PerformanceCycles.tsx` | Opens-at control; reminder schedule note |
| `src/pages/Reports.tsx` | Aggregate performance report + CSV |
| `e2e/batch6-operations.spec.ts` | Playwright Batch 6 |
| `package.json` | `test:e2e:batch6` + combined suite |

**Migrations:** none required for Batch 6 (reuses Batch 5 + `audit_logs`).

---

## 7. PHPUnit results

```bash
cd hris-backend
./.tools/php artisan test --filter='PerformanceReview|PerformanceObjective|PerformanceOperations'
```

**Result: 55 passed** (406 assertions), including Batch 6 `PerformanceOperationsBatch6Test` (5 tests).

---

## 8. Playwright results

```bash
cd emerald-people-flow-nigeria
npm run test:e2e:performance
```

**Result: 40 passed** (Batches 1–6; Chromium; isolated SQLite prepare). Final combined rerun after Batch 4 UI wait hardening: **40/40**.

| Suite | Count |
|---|---|
| Batch 1 | 9 |
| Batch 2 | 6 |
| Batch 3 | 8 |
| Batch 4 | 6 |
| Batch 5 | 4 |
| Batch 6 | 7 |

---

## 9. Regression results for Batches 1–5

| Concern | Result |
|---|---|
| Assessment independence / sealing | Pass |
| Discussion + ack (pre-finalise) | Pass |
| Draft locks / rating validation | Pass |
| Cycles + objectives | Pass |
| HOD policy block / reopen / quality gates | Pass |
| No weighted / forced distributions | Confirmed |

---

## 10. Scheduler, queue, mail and deployment prerequisites

1. Ensure `audit_logs` and `app_notifications` tables exist.
2. Configure host cron: `* * * * * php /path/to/artisan schedule:run`.
3. If notifications/mail use queues, run a queue worker.
4. Confirm mail / notification channel configuration for the environment.
5. Set cycle `reminder_schedule.days_before` intentionally; default is 7/3/1.
6. Designate escalation contact on cycles when HR should receive discussion-deadline reminders.
7. Do **not** enable HOD confidential self-assessment access until HR policy is written.

---

## 11. Outstanding issues, policy decisions and unverified requirements

| Item | Status |
|---|---|
| HOD self-assessment confidentiality policy | Still unresolved — pathway remains gated |
| Full Chromium fill of every self-assessment field without API assist | Partial — draft text verified in UI; submit via API for reliability |
| Production reminder delivery | Command + schedule verified locally; **not** claimed live in production |
| Legacy unused dialogs still present in `Performance.tsx` source | Primary CTA redirected; full deletion deferred as low risk |
| Advanced analytics / weighted scores | Out of scope |
| Module production-ready | **No** — dedicated readiness assessment still required |

---

## 12. Evidence-based Batch 6 classification

**Batch 6: Verified** for implemented operational features (dashboard, audit timeline, reports, reminder command/dedupe, browser gap closure) under test evidence above.

**Caveats (do not over-claim):**

- Reminder **production liveness** depends on deployment cron/worker — document as operational prerequisite.
- HOD confidential access remains **blocked** pending HR policy (Batch 5 carry-over).
- Overall Performance Review module is **not** declared production-ready.

Next step: dedicated end-to-end production-readiness assessment.
