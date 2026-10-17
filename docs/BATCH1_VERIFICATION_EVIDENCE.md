# Batch 1 Verification Evidence — Access Control & Assessment Independence

**Date:** 2026-10-17  
**Scope:** Critical security requirements from Batch 1 only  
**Verdict:** **Verified**

---

## 1. Testing infrastructure

| Item | Status |
|------|--------|
| System PHP on PATH | Unavailable (macOS 12; Homebrew bottles not provided) |
| Docker / Sail compose | Docker Desktop not installed; no `docker-compose.yml` published |
| GitHub Actions / `gh` auth | `gh` present but not logged in |
| Practical PHP runtime | Static PHP **8.2.32** CLI downloaded to `hris-backend/.tools/php` (gitignored) |
| Composer / vendor | Existing `vendor/` + PHPUnit 11.5 |
| Frontend package manager | npm (existing); added `@playwright/test@1.49.1` |
| Playwright browser | Chromium headless shell build v1148 |
| Test data isolation | SQLite file `database/e2e_batch1.sqlite` via `scripts/e2e_batch1_prepare.php` — no production records |

### Commands used

```bash
# Backend
export PATH="$PWD/.tools:$PATH"   # from hris-backend
./vendor/bin/phpunit --filter=PerformanceReviewIndependenceTest

# Frontend E2E (starts isolated API on :8010 + Vite on :8080)
cd ../emerald-people-flow-nigeria
npm run test:e2e:batch1
```

### Supporting scripts (test env only)

- `hris-backend/scripts/e2e_batch1_prepare.php` — migrate fresh SQLite + seed roles/reviews
- `hris-backend/scripts/e2e_batch1_serve.sh` — serve against that SQLite DB
- SQLite-safe branches in performance status migrations (so `RefreshDatabase` works)

### Minor app fix required for E2E

- `src/lib/api.ts`: prefer `VITE_API_URL` when set (previously ignored on some hosts). Needed so Playwright’s Vite server talks to the isolated API on port 8010.

---

## 2. PHPUnit results

**Command:** `./vendor/bin/phpunit --filter=PerformanceReviewIndependenceTest`  
**Result:** `OK` — **9 tests, 80 assertions** (1 PHPUnit deprecation notice, unrelated to failures)

| Requirement | Test coverage | Result |
|-------------|---------------|--------|
| Manager cannot read self-assessment before submit (list + detail) | `test_manager_cannot_read_self_assessment_until_manager_submits` on `/performance` and `/api/performance` | PASS |
| Visibility after manager submit | same + `test_employee_sees_hr_review_only_after_completed` | PASS |
| HR assessment sealed until finalised | `test_employee_sees_hr_review_only_after_completed` | PASS |
| Assigned-manager restriction (same department) | other manager 403 on GET + PUT | PASS |
| Employee isolation | `test_employee_cannot_retrieve_another_employees_review` | PASS |
| Server-side enforcement | All assertions on JSON API bodies (secret tokens absent) | PASS |
| Assessments remain separate | `test_employee_and_manager_assessments_remain_separate_after_manager_submit` | PASS |
| N/A explanation + form schema | `test_na_rating_requires_explanation`, `test_form_schema_does_not_require_self_assessment_accuracy_for_independent_phase` | PASS |
| HR can still view for administration | `test_hr_can_view_self_assessment_before_manager_submits` | PASS |

---

## 3. Playwright results

**Command:** `npm run test:e2e:batch1`  
**Result:** **9 passed** (exit code 0), ~1.6 minutes

| # | Test | Result |
|---|------|--------|
| 1 | API sealing before manager submit (`/performance`) | PASS |
| 2 | API sealing before manager submit (`/api/performance`) | PASS |
| 3 | Other same-department manager cannot view or act via API | PASS |
| 4 | Peer employee cannot retrieve another employee review via API | PASS |
| 5 | Employee cannot see manager assessment before manager submits | PASS |
| 6 | UI: manager sealed self-assessment; network payload omits secret | PASS |
| 7 | UI: unauthorised manager direct navigation → API 403 + error UI | PASS |
| 8 | N/A rating without explanation rejected; with explanation accepted | PASS |
| 9 | After manager submit: visibility rules + separate assessments | PASS |

Browser tests assert **API response bodies** (secret markers absent / sealed flags), not only CSS-hidden fields.

### Defect found during Playwright (test harness, not product ACL)

First UI unauthorised-navigation assertion matched the SPA document `GET /performance/:id` (200) instead of `/api/performance/:id`. Filter corrected to `/api/performance/:id` only. Product ACL behaviour was already correct (API tests returned 403).

---

## 4. Security requirement checklist

| # | Requirement | Evidence | Status |
|---|-------------|----------|--------|
| 1 | Manager independence before submit | PHPUnit + Playwright list/detail; secret absent from JSON | **PASS** |
| 2 | Correct visibility after manager submit | PHPUnit + Playwright #9 | **PASS** |
| 3 | Employee cannot see HR assessment before finalised | PHPUnit `test_employee_sees_hr_review_only_after_completed` | **PASS** |
| 4 | Assigned-manager restriction | PHPUnit + Playwright API + UI | **PASS** |
| 5 | Employee isolation | PHPUnit + Playwright | **PASS** |
| 6 | Server-side enforcement (not UI-only) | Direct API assertions in both suites | **PASS** |
| 7 | Authorised workflow still works; assessments separate | PHPUnit separate columns; manager/HR submit paths | **PASS** |
| 8 | Rating labels / N/A validation / form schema | PHPUnit N/A + schema; Playwright N/A | **PASS** |

---

## 5. Batch 1 completion criterion

**Batch 1 is verified.** Sufficient passing backend (PHPUnit) and browser/API (Playwright) evidence exists for the critical security requirements.

Batch 2 (discussion / acknowledgement / disagreement) may proceed.
