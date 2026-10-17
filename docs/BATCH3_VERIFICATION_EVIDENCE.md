# Batch 3 Verification Evidence — Forms, Ratings, Draft Persistence

**Date:** 17 October 2026  
**Classification:** **Verified** (PHPUnit + Playwright executed successfully)  
**Scope:** Emerald Performance Review Batch 3 only (guide §§5–7). Batch 4 / objectives subsystem not started.

---

## 1. Initial form audit (pre-change)

| Area | Finding |
|---|---|
| Employee self-assessment (`Performance.tsx`) | Legacy 16-question form with incompatible 1–5 labels (Poor→Excellent) and employee overall self-rating; not aligned to guide §5 |
| Manager assessment (`PerformanceReviewDetail.tsx`) | Six generic fields; missing objective-agreement Yes/No/N/A, behaviour ratings, PIP, development owner/date, manager support |
| Rating scale | Conflicting labels vs guide §7; N/A explanation partially enforced |
| Draft persistence | Employee could POST `/performance/self` without submit; no explicit draft flag on submit-self; manager “draft” advanced status to `manager_review` and unsealed self-assessment via content-based `managerHasSubmitted` |
| Partial JSON updates | Risk of nested key stripping by Laravel `validate()` when only some `manager_review.*` rules declared |
| Objectives | No structured objectives store — Batch 4 dependency; narrative fields required for now |
| Batch 1–2 | Sealing, ACL, discussion, acknowledgement intact and must remain so |

---

## 2. Files / endpoints / schemas changed

### Backend (`hris-backend`)

| Path | Change |
|---|---|
| `app/Http/Controllers/PerformanceReviewController.php` | §5 required-field submit validation; `draft` on submit-self; manager draft without status advance; full §6 required fields + rating/N/A/PIP validation; `mergeAssessmentJson` / legacy key normalisation; `managerHasSubmitted` status-only (draft must not unseal); `form_schema` §5/§6/§7 |
| `tests/Feature/PerformanceReviewFormsRatingsDraftTest.php` | New Batch 3 feature tests |
| `tests/Feature/PerformanceReviewIndependenceTest.php` | Manager submit payloads expanded for §6 required fields |
| `scripts/e2e_batch1_prepare.php` | Seeds draft-self, draft-manager, historical reviews for E2E |

**Migrations:** None required (JSON columns already store assessment payloads).

### Frontend (`emerald-people-flow-nigeria`)

| Path | Change |
|---|---|
| `src/lib/performanceRatings.ts` | Shared guide §7 scale |
| `src/lib/performanceFormSchema.ts` | §5/§6 field defs, hydrate helpers, legacy key mapping |
| `src/pages/Performance.tsx` | §5 self-assessment UI; Save draft / Submit; draft resume |
| `src/pages/PerformanceReviewDetail.tsx` | §6 manager form sections; shared ratings; Save draft; form unlock while drafting |
| `src/lib/api.ts` | `submitSelfAssessment` body + `draft`; `managerReview(..., { draft })` |
| `e2e/batch3-forms-ratings-drafts.spec.ts` | Batch 3 Playwright suite |
| `e2e/helpers/batch1.ts` | Shared valid payloads + new manifest IDs |
| `e2e/batch1-independence.spec.ts` | Full manager payloads for §6 validation |
| `package.json` | `test:e2e:batch3`; combined `test:e2e:performance` includes Batch 3 |

**Endpoints (unchanged routes, behaviour extended):**

- `PUT /performance/{id}/submit-self` — `draft: true` saves without status change; omit/false validates §5 and sets `self_assessment_submitted`
- `PUT /performance/{id}/manager-review` — `draft: true` merges JSON without status change or HR notify; submit validates §6/§7 and sets `hr_review`

---

## 3. Historical-data compatibility

- Legacy self keys (`achievements`, `completedGoals`, etc.) map onto §5 names on read/submit; original keys retained in JSON.
- Unrecognised keys preserved via `mergeAssessmentJson` / FE hydrate.
- Manager legacy keys (`observations`, `performance_assessment`, `recommendations`) still written as aliases.
- No production reseed/reset. Completed historical E2E fixture remains readable with discussion + acknowledgement.
- **Deprecated (not deleted):** employee numeric self-rating UI removed from primary form (not required by §5); legacy `overallRating` values remain readable on old records.
- **Deferred to Batch 4:** per-objective structured rows (description/target/actual/rating columns). Narrative `objective_results` / `objective_assessments_narrative` bridge the gap.

---

## 4. PHPUnit

**Command:**

```bash
cd hris-backend
./.tools/php vendor/bin/phpunit --filter='PerformanceReviewIndependenceTest|PerformanceReviewDiscussionAcknowledgementTest|PerformanceReviewFormsRatingsDraftTest'
```

**Result:** `OK` — **26 tests, 187 assertions** (Batches 1 + 2 + 3).

---

## 5. Playwright

**Commands:**

```bash
cd emerald-people-flow-nigeria
npm run test:e2e:performance
# or individually:
npm run test:e2e:batch1
npm run test:e2e:batch2
npm run test:e2e:batch3
```

**Result:** **23 passed** (Batch 1: 9, Batch 2: 6, Batch 3: 8) in Chromium against isolated SQLite (`e2e_batch1_prepare.php`).

---

## 6. Draft persistence and submission-lock

| Check | Evidence |
|---|---|
| Partial draft save without submit | PHPUnit `test_employee_draft_saves_partial…`; Playwright employee draft test |
| Reload restores draft | API reload assertions in PHPUnit + Playwright |
| Draft does not advance status | Employee stays `self_assessment_requested`; manager stays `self_assessment_submitted` |
| Draft does not unseal self-assessment | `managerHasSubmitted` status-only; Playwright manager draft sealed check |
| Draft does not erase HR/discussion/ack | PHPUnit manager draft preserves `hr_review`, `meeting_notes`, acknowledgement |
| Submit validates required fields | 422 on incomplete self/manager submit |
| Post-submit ordinary edits rejected | 422 on draft/submit after lock (employee + manager) |

---

## 7. Rating scale and N/A validation

| Check | Result |
|---|---|
| Shared §7 labels (Exceptional … Does Not Meet / N/A) | `form_schema.rating_scale` + FE `PERFORMANCE_RATING_OPTIONS` |
| Invalid rating (e.g. 7, 9) rejected | 422 |
| N/A without explanation rejected | 422 (overall + behaviour) |
| N/A with explanation accepted | 200 |
| PIP Yes without reason rejected | 422 |
| No weighted / auto overall calculation | Confirmed — overall rating remains manager judgement |

---

## 8. Batch 1 and Batch 2 regression

| Suite | Result |
|---|---|
| `PerformanceReviewIndependenceTest` | Pass |
| `PerformanceReviewDiscussionAcknowledgementTest` | Pass |
| Playwright Batch 1 | 9/9 |
| Playwright Batch 2 | 6/6 |

Sealing, assigned-manager ACL, peer denial, discussion, acknowledgement, and disagreement behaviour remain intact.

---

## 9. Requirements not fully implemented (documented dependencies)

1. **Structured objectives agreement workflow (Batch 4)** — per-objective rows with target/actual/rating columns; current system uses narrative fields designed for later integration.
2. **Dedicated review-cycle administration** — out of scope.
3. **HOD approval / weighted scores / forced distributions** — explicitly excluded.
4. **Employee self-rating** — not prescribed in §5; removed from primary UI (legacy values readable).

---

## 10. Remaining defects / blockers

| Item | Severity | Notes |
|---|---|---|
| UI employee draft journey coverage | Low | Playwright Batch 3 emphasises API draft/submit locks; manager UI asserts read path. Full Chromium fill of all 10 §5 textareas is optional hardening. |
| List-page manager dialog (`Performance.tsx`) | Low | Legacy list dialog still uses older manager fields; primary workflow is `PerformanceReviewDetail.tsx`. |
| Production data migration | N/A | Not required for Batch 3 JSON shape |

**No blockers** for Batch 3 acceptance under the verified test evidence above.

---

## Classification

**Batch 3: Verified**

Do **not** treat the full HRIS as production-ready. Proceed to Batch 4 (objectives) only when scheduled.
