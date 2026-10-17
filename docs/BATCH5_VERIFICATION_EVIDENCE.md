# Batch 5 — Verification Evidence

**Module:** Emerald Industrial Co. FZE HRIS — Performance Review  
**Scope:** HOD approval (policy-safe), HR quality checklist, finalisation gates, HR-only reopen with history, durable critical audit  
**Date:** 2026-10-17

---

## 1. Initial workflow findings

| Area | Pre-Batch 5 | Gap |
|---|---|---|
| HOD | Cycle `hod_approval_required` flag only | No `hod_review` stage, no authorised approver, no calibration audit |
| Acknowledgement | Only after `completed` | Guide sequence: after discussion, before finalisation |
| Finalisation | Discussion + light HR content | Missing derived quality checklist, ack, HOD, development ownership |
| Reopen | None | HR-only reopen with reason and retained snapshots |
| Audit | Best-effort `safeAuditLog` | Critical events could succeed without a durable audit row |

**Policy conflict (guide §3 vs §12):** HOD calibration vs confidential reviews limited to HR and line manager. **Unresolved by HR.** Batch 5 does **not** expose `self_assessment` to HOD. Operational HOD decisions require `hod_confidential_access_authorised` on the cycle (manager assessment only).

---

## 2. HOD approval implementation and policy blockers

### Implemented

- After manager submit: cycle without HOD → `hr_review` / `hod_status=not_required`.
- Cycle with HOD + policy **not** authorised → `hod_review` / `hod_status=blocked_pending_policy`; `hod-decide` returns **403**.
- Cycle with HOD + policy authorised + designated `hod_approver_user_id` → `hod_review` / `pending`; authorised approver may approve or return.
- Rating change requires `rating_change_reason`; previous/new ratings stored on `performance_review_approvals` and revision snapshot.
- Self-assessment remains sealed from HOD in API presentation (`hod_self_assessment_access=denied`).
- HR may set `hod_confidential_access_authorised` on open cycles (policy unlock only); unblocks `blocked_pending_policy` reviews to `pending`.

### Not operational for live confidential data

Until HR confirms whether HODs may see employee self-assessments (or confirms the current least-privilege manager-only view is permanent):

- Do **not** treat HOD approval as fully production-ready for sensitive reviews.
- Do **not** broaden self-assessment access based on the HOD flag alone.

**HR must confirm before department go-live of HOD calibration:** whether authorised HODs may view employee self-assessment contents, or only manager assessments (current implementation).

---

## 3. HR quality-check and finalisation rules

Derived checklist (`PerformanceQualityChecklist`) from persisted state:

1. Objectives agreed (cycle-linked) or N/A (legacy)
2. Self-assessment submitted
3. Manager assessment with rating + rationale
4. Discussion recorded
5. Employee acknowledgement (receipt ≠ agreement)
6. HOD approval complete / N/A / blocked
7. Development action owner + target date when a tracked action/PIP is present
8. Calibration rating-change reasons
9. Manual HR confirmation (`checklist_reviewed`) — distinct from derived ticks

`PUT /performance/{id}/complete` is server-gated: incomplete items return **422** with `blocking` details; status and `hr_review` are not partially updated. Status `completed` retained for finalisation.

**Acknowledgement timing corrected:** after discussion, while `hr_review` (before finalise).

---

## 4. Reopening and historical revision behaviour

- `POST /performance/{id}/reopen` — HR only; mandatory reason (min 5 chars); `return_to_status` controlled.
- Pre-reopen snapshot → `performance_review_revisions` (`pre_reopen`).
- Prior approvals invalidated; quality check timestamps cleared; ack cleared when returning before HR stage.
- Former `completed` status retained in `status_before_reopen` / revision `status_at_snapshot`.

---

## 5. Audit event coverage and durability

`PerformanceCriticalAudit` requires `audit_logs` and throws on failure (aborts the transaction). Critical actions:

- `performance_hod_approved` / `performance_hod_returned`
- `performance_quality_checklist_confirmed`
- `performance_review_finalised`
- `performance_review_reopened`

Ordinary best-effort `safeAuditLog` remains for non-critical events.

---

## 6. Files, routes, models and migrations changed

### Backend

| Path | Role |
|---|---|
| `database/migrations/2026_10_17_220000_batch5_hod_quality_reopen_audit.php` | Cycle/review HOD + quality + reopen fields; revisions; approvals |
| `app/Models/PerformanceReview.php` | New fillable/casts/relations |
| `app/Models/PerformanceReviewCycle.php` | Policy + approver fields |
| `app/Models/PerformanceReviewRevision.php` | Snapshot model |
| `app/Models/PerformanceReviewApproval.php` | HOD decision model |
| `app/Support/PerformanceCriticalAudit.php` | Durable critical audit |
| `app/Services/PerformanceQualityChecklist.php` | Derived §8 checklist |
| `app/Http/Controllers/PerformanceReviewGovernanceController.php` | Checklist, HOD, reopen, revisions |
| `app/Http/Controllers/PerformanceReviewController.php` | `hod_review`, ack timing, finalise gates, HOD sealing/index |
| `app/Http/Controllers/PerformanceReviewCycleController.php` | Policy unlock on open cycles |
| `routes/api-routes.php` | quality-checklist, hod-decide, reopen, revisions |
| `tests/Feature/PerformanceReviewGovernanceBatch5Test.php` | Batch 5 PHPUnit |
| `scripts/e2e_batch1_prepare.php` | Batch 5 E2E fixtures |

### Frontend

| Path | Role |
|---|---|
| `src/lib/api.ts` | Batch 5 API helpers |
| `src/pages/PerformanceReviewDetail.tsx` | Ack before finalise; checklist; HOD; reopen |
| `src/pages/PerformanceCycles.tsx` | Policy authorisation control |
| `e2e/batch5-governance.spec.ts` | Playwright Batch 5 |
| `e2e/batch2-discussion-acknowledgement.spec.ts` | Ack-before-finalise sequence |
| `e2e/batch3-forms-ratings-drafts.spec.ts` | Label regression fix |
| `e2e/helpers/batch1.ts` | Manifest types |
| `package.json` | `test:e2e:batch5` + combined suite |

---

## 7. PHPUnit test results

```bash
cd hris-backend
./.tools/php artisan test --filter='PerformanceReview|PerformanceObjective'
```

**Result: 50 passed** (366 assertions)

Includes:

- Batch 5 `PerformanceReviewGovernanceBatch5Test` — 10 passed  
- Batches 1–4 regression suites — all passed  

---

## 8. Playwright test results

```bash
cd emerald-people-flow-nigeria
npm run test:e2e:performance
```

**Result: 33 passed** (Chromium, isolated SQLite via `e2e_batch1_prepare.php`)

| Suite | Count |
|---|---|
| Batch 1 | 9 |
| Batch 2 | 6 |
| Batch 3 | 8 |
| Batch 4 | 6 |
| Batch 5 | 4 |

---

## 9. Regression results for Batches 1–4

| Concern | Result |
|---|---|
| Assessment independence / sealing | Pass |
| Assigned-manager ACL | Pass |
| Discussion + receipt acknowledgement | Pass (sequence updated to pre-finalise) |
| Draft non-advancement / submit locks | Pass |
| Cycles + structured objectives | Pass |
| No weighted ratings introduced | Confirmed |

---

## 10. Remaining defects, policy decisions and deployment prerequisites

| Item | Status |
|---|---|
| HOD self-assessment visibility policy | **Blocked** — HR decision required |
| HOD live use on confidential reviews | Not authorised until policy documented |
| Full audit-history dashboard | Out of scope (later) |
| Scheduled reminder execution | Config only — later |
| Weighted / forced distributions | Explicitly not implemented |
| Module production-ready declaration | **No** — Batch 5 only |

**Deployment prerequisites**

1. Run migration `2026_10_17_220000_batch5_hod_quality_reopen_audit`.
2. Ensure `audit_logs` exists (critical audits will fail closed otherwise).
3. Designate `hod_approver_user_id` per cycle before enabling HOD.
4. Set `hod_confidential_access_authorised` only after written HR policy confirmation.
5. Train HR on quality checklist + reopen/reason requirements.

---

## 11. Evidence-based Batch 5 classification

**Batch 5: Partially Verified**

| Capability | Classification |
|---|---|
| HR quality checklist + finalisation gates | Verified |
| Acknowledgement before finalisation | Verified |
| HR-only reopen + revision history | Verified |
| Durable critical audit for Batch 5 events | Verified |
| HOD data model, status transitions, denied-access behaviour | Verified in tests |
| HOD pathway as operational for live confidential reviews | **Not verified / blocked on policy** |

Do **not** mark HOD approval as operational for department confidential data while the confidential-review access policy remains unresolved.  
Do **not** declare the entire Performance Review module production-ready.
