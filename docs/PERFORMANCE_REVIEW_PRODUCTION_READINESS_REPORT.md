# Emerald HRIS Performance Review — Production-Readiness Report

**Module:** Emerald Industrial Co. FZE HRIS — Performance Review  
**Requirements source:** *Emerald Integrated Performance Management & HRIS Guide*  
**Evidence baseline:** `docs/BATCH1`–`BATCH6_VERIFICATION_EVIDENCE.md`  
**Assessment date:** 2026-10-18  
**Repos:** repositories `emerald-people-flow-nigeria` (frontend) + `hris-backend` (API) only  
**Constraint:** No production deploy, no real employee data mutation, no invented HR policy

---

## 1. Executive verdict

### Conditionally ready for a restricted pilot

A bounded departmental pilot is justified by the evidence **if and only if** the following controls remain in force:

| Bound | Reason |
|---|---|
| **HOD confidential self-assessment access stays OFF** (`hod_confidential_access_authorised` remains false / unset for live cycles) | Guide §3 vs §12 unresolved; pathway safely blocked (Batch 5 + acceptance) |
| **HOD calibration of confidential reviews is out of pilot scope** unless HR later authorises manager-assessment-only HOD review and documents it | Authorised HOD path exists in code but requires explicit policy before live use |
| **Deadline reminders treated as best-effort / optional** until production cron + notification channel are verified | Command + schedule registered locally; production liveness **unverified** |
| **Pilot uses non-production or carefully observed production config after deploy checklist** | Production host config (APP_DEBUG, mail, queues, DB backups) was **not** accessed in this assessment |
| **Weighted ratings / forced distributions remain disabled** | Out of scope; confirmed absent |

**Not production-ready** for unrestricted department-wide go-live: production deployment readiness, backup/restore, live mail delivery, and the HOD confidentiality policy decision remain outstanding.

**Not “not ready”:** Core employee → manager → discussion → acknowledgement → HR quality → finalise → reopen workflows, assessment sealing, and ACL regressions passed automated evidence in an isolated representative test environment.

---

## 2. Deployment architecture (Phase 1)

### Verified from repository configuration

| Layer | Evidence | Classification |
|---|---|---|
| **Frontend** | Vite + React (`emerald-people-flow-nigeria`); `npm run build` succeeds; Lovable tagger in toolchain; static assets under `/lovable-uploads/` | **Verified** (build) |
| **Frontend API target** | `src/lib/api.ts`: prefers `VITE_API_URL`; otherwise falls back to `https://hris-backend-to3i.onrender.com/api` | **Code inspection** — live FE host not proven from repo alone |
| **Backend runtime** | `hris-backend/dockerfile`: PHP **8.2**-Apache; extensions `pdo_pgsql`, `pdo_mysql`, zip, mbstring, bcmath, dom, xml, intl, gd | **Verified** (Dockerfile) |
| **Backend deploy host** | Dockerfile CMD references Render `$PORT`, runs `php artisan migrate --force`, then Apache | **Inferred** Render-style container; **not** SSH-verified |
| **Database** | Migrations support SQLite (E2E) and production engines via PDO drivers; intended engine for Render not confirmed in this assessment | **Partially verified** |
| **Auth** | Laravel Sanctum bearer tokens (`config/sanctum.php`); session driver configurable | **Code inspection** + E2E login |
| **CORS** | `config/cors.php`: `allowed_origins => ['*']`, `supports_credentials => true` | **Verified** in repo — operational risk noted below |
| **Scheduler registration** | Laravel 12 schedules in `routes/console.php` (not `Kernel.php`); includes `performance:send-reminders` daily **08:00 Africa/Lagos** | **Verified** locally via `php artisan schedule:list` |
| **Queue** | `.env.example` defaults `QUEUE_CONNECTION=database`; E2E uses `sync` | **Unverified** in production |
| **Mail** | `.env.example` uses `MAIL_MAILER=log`; production mailer unknown | **Unverified** in production |
| **Migrations on boot** | Docker CMD runs `migrate --force` | **Code inspection** — safe for additive migrations; recovery path not exercised against a staging clone |
| **CI** | No authenticated GitHub Actions run in this assessment | **Unverified** |
| **Staging** | No separate staging topology documented/accessible in workspace | **Unverified / unavailable** |
| **Production access** | Not used (policy) | **Intentionally unverified** |

### Explicit non-claims

- Production cron / Render cron job for `schedule:run` was **not** observed.
- Production queue workers were **not** observed.
- Production `APP_DEBUG`, HTTPS termination, cookie flags, and secret store were **not** inspected.
- Backup/restore of the live database was **not** performed.
- Default API fallback URL in frontend source does **not** prove which frontend deployment currently serves users.

---

## 3. Release-readiness matrix (Phase 2)

Status key: **Verified** · **Partially verified** · **Unverified** · **Failed** · **Blocked by policy or infrastructure**

| # | Requirement (guide / batches) | Implementation | Verification | Evidence | Gap | Severity | Corrective action | Blocks departmental release? |
|---|---|---|---|---|---|---|---|---|
| R1 | Assessment independence / sealing | Server-side seal until manager submit; dual JSON | Batches 1, 3, 6; PHPUnit; Playwright; acceptance | BATCH1–3,6; acceptance | — | — | Maintain | No (pilot OK) |
| R2 | Cross-employee / out-of-scope manager ACL | 403 on peers, unassigned managers | Batch 1 UI+API; acceptance | BATCH1; acceptance | — | — | Maintain | No |
| R3 | Discussion + acknowledgement (receipt ≠ agreement) | `/discussed`, `/sign`; disagreement flags | Batch 2; acceptance | BATCH2; acceptance | — | — | Maintain | No |
| R4 | Guide form schema + rating scale; drafts | Batch 3 validation + draft merge | Batch 3; PHPUnit | BATCH3 | Full Chromium fill of every field still partially API-assisted in places | Low | Optional UI harden | No |
| R5 | Cycles, roster, idempotent open | Cycle entities + unique cycle/employee | Batch 4 | BATCH4 | — | — | Maintain | No |
| R6 | Structured objectives + amend history | Objectives + change log | Batch 4 | BATCH4 | — | — | Maintain | No |
| R7 | HOD approval when authorised | `hod_review` + decide + calibration reason | Batch 5 PHPUnit + Playwright | BATCH5 | Live confidential HOD use needs policy | High (policy) | HR decision | **Yes for HOD-required confidential cycles** |
| R8 | HOD blocked without policy unlock | `blocked_pending_policy`; no self exposure | Batch 5; acceptance | BATCH5; acceptance | — | — | Keep OFF | No if HOD path excluded |
| R9 | HR quality checklist gates finalise | Derived checklist + manual confirm | Batch 5; acceptance | BATCH5; acceptance | — | — | Maintain | No |
| R10 | Incomplete cannot finalise | 422 + no partial status update | Batch 5; acceptance | BATCH5 | — | — | Maintain | No |
| R11 | HR-only reopen + history | Revisions; approvals invalidated | Batch 5; acceptance | BATCH5; acceptance | — | — | Maintain | No |
| R12 | Critical audit fail-closed | `PerformanceCriticalAudit` | Batch 5 PHPUnit | BATCH5 | — | — | Maintain | No |
| R13 | Audit timeline UI + redaction | Timeline endpoint + FE panel | Batch 6 | BATCH6 | — | — | Maintain | No |
| R14 | Dashboard + reports + CSV | Aggregates from persisted state | Batch 6 | BATCH6 | — | — | Maintain | No |
| R15 | Deadline reminders | `performance:send-reminders` + dedupe | Local command + schedule list | BATCH6; this report | Production cron/mail **unverified** | Medium | Ops: cron + mail proof | Soft — disable reliance in pilot |
| R16 | Employee draft resume in browser | Detail page draft/submit | Batch 6 UI; acceptance (after harden) | BATCH6; acceptance | — | — | Maintain | No |
| R17 | Full E2E lifecycle acceptance | Combined + `production-acceptance.spec.ts` | Isolated SQLite Chromium | This report | Not against prod-like Postgres host | Medium | Staging E2E before broad rollout | Soft for pilot |
| R18 | Production config / HTTPS / secrets | Docker + env examples | Code inspection only | This report | Live settings unknown | High (ops) | Deploy checklist | Soft if pilot on controlled env |
| R19 | Backup / restore / rollback | Docs incomplete for PR module | Not tested | — | No restore evidence | High (ops) | Ops procedure + dry-run | Soft for small pilot |
| R20 | HOD may view self-assessment? | Explicitly **denied** in code | Policy unresolved | BATCH5 | HR decision required | **Blocker (policy)** | Document decision; do not unlock blindly | **Yes for that feature** |

---

## 4. End-to-end acceptance results (Phase 3)

### Environment

- Isolated SQLite: `hris-backend/database/e2e_batch1.sqlite` via `scripts/e2e_batch1_prepare.php`
- API `127.0.0.1:8010`, Vite `127.0.0.1:8080`, Chromium headless
- **Not** production DB; **not** claimed as production acceptance

### Journey coverage

| Step | Result | How exercised |
|---|---|---|
| 1–3 Cycle create / roster / open | **Verified** | Batch 4 + Batch 6 UI |
| 4–5 Objectives agree / amend history | **Verified** | Batch 4 |
| 6–7 Self-assessment + draft resume | **Verified** | Batch 6 UI fill/save/reload/submit; acceptance draft visibility |
| 8 Manager independent submit | **Verified** | Batches 1,3,5; acceptance |
| 9 Confidentiality before/after submit | **Verified** | Batches 1,3; acceptance |
| 10 Discussion | **Verified** | Batch 2 UI+API; acceptance |
| 11 Ack + disagreement | **Verified** | Batch 2; acceptance (`means_agreement=false`) |
| 12 HOD required vs not | **Verified** (policy-safe) | Batch 5 authorised + blocked paths; acceptance blocked path |
| 13–14 Quality checklist / incomplete block | **Verified** | Batch 5; acceptance |
| 15–16 Reopen + history | **Verified** | Batch 5; acceptance |
| 17–18 Finalise + employee sees HR | **Verified** | Batch 5; acceptance |
| 19 Dashboard / audit | **Verified** | Batch 6; acceptance |
| 20 Notifications / reminders in intended env | **Partially verified** | Local dry-run + dedupe PHPUnit; **production delivery unverified** |

### Playwright acceptance suite

```text
npm run test:e2e:acceptance
→ 5 passed (1.9m)

npm run test:e2e:performance   # Batches 1–6 + acceptance
→ 45 passed (8.0m)
```

---

## 5. Security findings (Phase 4)

### Verified controls (API + UI negative tests)

- Peers cannot read another employee’s review (403).
- Unassigned / other-department managers cannot view or mutate assigned reviews.
- Self-assessment sealed from manager until manager submit; network payload omits secrets.
- Employee cannot see manager assessment before manager submit.
- HR review sealed from employee until `completed`.
- Drafts do not advance workflow status inappropriately.
- Post-submit self/manager edits rejected (422).
- Only HR can reopen; employees/managers cannot finalise.
- Audit timeline forbidden to peers; assessment JSON redacted for non-HR viewers.
- HOD without `hod_confidential_access_authorised` cannot decide; self-assessment remains sealed from HOD.
- Critical audit path fail-closed for protected operations (PHPUnit).

### Residual / unresolved

| Finding | Severity | Notes |
|---|---|---|
| **HOD self-assessment confidentiality policy unresolved** | **High (policy)** | Keep `hod_confidential_access_authorised` off for live confidential cycles |
| CORS `allowed_origins: *` with `supports_credentials: true` | Medium | Tighten to known frontend origins before broad production trust |
| Production Sanctum / HTTPS / cookie flags | Unverified | Ops must confirm |
| Direct API aliases (`/performance` and `/api/performance`) | Covered in Batch 1 dual-root tests | Maintain parity on new routes |

### HOD confidentiality — required HR decision

**Question for HR (blocks enabling HOD calibration on confidential reviews):**

> When a cycle requires HOD approval, may an authorised HOD view the employee’s **self-assessment** contents, or only the **manager assessment** (current least-privilege implementation)?

| Decision | Operational impact |
|---|---|
| **Manager-assessment only (current code default when unlocked)** | Set `hod_confidential_access_authorised=true` + designated `hod_approver_user_id` after written approval; HOD still must not receive self-assessment via API presentation |
| **HOD may read self-assessment** | Requires **new** product change + security review; **do not** treat the current flag as granting self-assessment access |
| **No HOD on confidential reviews** | Leave HOD flag off or leave pathway `blocked_pending_policy`; pilot without HOD stage |

**Do not** enable the unlock flag on live confidential cycles without a written decision.

---

## 6. Data integrity (Phase 5–6)

| Topic | Result | Evidence class |
|---|---|---|
| Migrations present for PR module | Yes (reviews, discussion/ack, cycles/objectives, Batch 5 HOD/quality/revisions) | Repo |
| Duplicate cycle launch | Idempotent open tested | Batch 4 |
| Draft preserves other assessments | Verified | Batch 3 PHPUnit/Playwright |
| Repeat ack / disagreement | Verified | Batch 2 |
| Failed finalise leaves prior state | 422 without partial complete | Batch 5 |
| Critical audit failure aborts | Fail-closed | Batch 5 PHPUnit |
| Reminder failure does not mutate reviews | Designed + PHPUnit | Batch 6 |
| Reopen preserves snapshots / invalidates approvals | Verified | Batch 5; acceptance |
| Production backup/restore | **Unverified** | Not run |
| Postgres-specific FK/index behaviour under load | **Unverified** | E2E used SQLite |
| Concurrent finalise race under multi-worker prod | **Partially verified** | Logic tests only |

---

## 7. Deployment readiness (Phase 5)

### Scheduler fix (in-scope blocker closed)

Under Laravel 12, schedules registered only in `app/Console/Kernel.php` were **not** active. Reminder schedule was moved to `routes/console.php` with other HRIS jobs.

**Local verification:**

```text
php artisan schedule:list
→ performance:send-reminders  daily 08:00 Africa/Lagos

php artisan test --filter=PerformanceOperationsBatch6Test
→ includes “performance reminder command is registered on active schedule”
→ 6 passed
```

### Still required in the actual host (unverified)

1. Cron (or platform scheduler) running `php artisan schedule:run` every minute.
2. Queue worker if mail/notifications are queued.
3. Working mail / in-app notification channel credentials (not logged in this report).
4. Confirm `APP_ENV=production`, `APP_DEBUG=false`, HTTPS, and secrets via platform env — not committed files.
5. Confirm all Batch 4–5 migrations applied on the target DB (`migrate --force` on container boot helps new deploys; verify on existing volumes).
6. Documented backup before first production migrate of new tables.

---

## 8. Test summary (Phase 8)

| Suite | Command | Result | Environment |
|---|---|---|---|
| PHPUnit Performance module | `php artisan test --filter=Performance` | **56 passed** (409 assertions) | Local PHP 8.2.32 (`.tools/php`), SQLite test DB |
| Batch 6 ops + schedule assertion | `--filter=PerformanceOperationsBatch6Test` | **6 passed** | Same |
| Frontend production build | `npm run build` | **Succeeded** (~2m 34s) | Node / Vite 5 |
| Playwright Batches 1–6 + acceptance | `npm run test:e2e:performance` | **45 passed** (8.0m) | Isolated SQLite E2E |
| Playwright acceptance only | `npm run test:e2e:acceptance` | **5 passed** (1.9m) | Isolated SQLite E2E |
| Frontend lint | `npm run lint` | **883 pre-existing problems** | Not treated as PR release gate; not introduced by this phase |
| Production reminder delivery | — | **Not run** | No prod access |
| Staging Postgres E2E | — | **Not run** | No staging access |

**Do not** treat SQLite Playwright green as proof of production hosting health.

---

## 9. Corrections made in this final phase

| Change | Purpose | Regression |
|---|---|---|
| `hris-backend/routes/console.php` — register `performance:send-reminders` (Africa/Lagos, withoutOverlapping, onOneServer) | Laravel 12 schedule was dead in Kernel-only registration | `PerformanceOperationsBatch6Test` schedule assertion; `schedule:list` |
| `hris-backend/app/Console/Kernel.php` — emptied schedule with deprecation note | Avoid dual/conflicting schedule sources | Same |
| `hris-backend/tests/Feature/PerformanceOperationsBatch6Test.php` — assert reminder on active schedule | Prevent silent schedule regression | PHPUnit |
| `emerald-people-flow-nigeria/e2e/production-acceptance.spec.ts` | Combined lifecycle acceptance | `npm run test:e2e:acceptance` (5/5) |
| `emerald-people-flow-nigeria/package.json` — `test:e2e:acceptance` + include in performance suite | Runnable acceptance entrypoint | Package scripts |

No broadening of HOD self-assessment access. No production data changes.

---

## 10. Outstanding issues

| ID | Severity | Impact | Owner | Resolution |
|---|---|---|---|---|
| O1 | **High (policy)** | Cannot safely enable HOD on confidential reviews | HR leadership | Written HOD confidentiality decision |
| O2 | **High (ops)** | Reminders may never fire in production | Platform / DevOps | Prove cron + one live reminder in non-prod then prod |
| O3 | **High (ops)** | Deploy/config/backup unverified | Platform / DevOps | Complete deployment checklist; staging migrate dry-run |
| O4 | Medium | CORS wildcard + credentials | Backend eng | Restrict origins |
| O5 | Medium | E2E only on SQLite | QA / Eng | One staging run on intended DB engine |
| O6 | Low | Legacy unused dialogs in `Performance.tsx` | Frontend | Optional cleanup |
| O7 | Low | Frontend lint debt (pre-existing) | Frontend | Separate hygiene track |

---

## 11. HR decisions required

1. **HOD confidentiality (mandatory before HOD go-live):** self-assessment visible to HOD, manager-assessment only, or no HOD on confidential cycles (see §5).
2. **Pilot scope:** confirm departments, cycle types, and whether HOD-required cycles are excluded.
3. **Reminder escalation contacts:** who receives discussion-deadline escalations on each cycle.
4. **Go-live communication:** employee/manager guidance for draft/submit, disagreement language, and reopen process.

---

## 12. Production deployment checklist

Ordered actions (do **not** execute against production as part of this assessment):

| # | Action | Role | Post-check |
|---|---|---|---|
| 1 | Take DB backup; verify restore on a clone | DevOps | Restore smoke query |
| 2 | Deploy backend image with pending migrations | DevOps | `migrate:status` shows Batch 4–5 applied |
| 3 | Confirm `APP_DEBUG=false`, secrets via env, HTTPS | DevOps | Health + login |
| 4 | Deploy frontend with explicit `VITE_API_URL` (no accidental wrong API) | Frontend/DevOps | Network tab hits intended API |
| 5 | Install cron: `* * * * * php artisan schedule:run` | DevOps | `schedule:list` + log line at 08:00 WAT |
| 6 | Start queue worker if required | DevOps | Failed-job empty after test notify |
| 7 | Create **pilot** cycle with `hod_confidential_access_authorised=false` | HR | Roster preview matches eligibility |
| 8 | Walk one employee + manager + HR path on pilot data | HR + Eng | Status `completed`; audit timeline present |
| 9 | Attempt HOD decide on blocked cycle — expect 403 | Eng | Self-assessment still sealed |
| 10 | Optional: dry-run reminders `--dry-run` then one real test user | Eng | Dedupe; no status mutation |
| 11 | Monitor logs 48h for 5xx / audit failures | DevOps | No critical audit aborts unexplained |

**Rollback:** redeploy previous image; restore DB from pre-migrate backup if schema change fails. Do not hand-edit review JSON in production.

---

## 13. Residual risks

Even after recommended pilot controls:

- Production mail/reminder liveness unknown → missed deadlines possible.
- SQLite E2E may miss engine-specific constraint/locking issues.
- CORS/credentials configuration is permissive.
- HOD unlock flag is a sharp edge: operational misuse could start HOD workflow without resolving self-assessment policy (self still sealed, but process expectations may confuse HR).
- Large frontend bundle (~2.7 MB JS) — performance/UX risk, not functional blocker.
- Assessment relied on prior batch evidence plus final regression; no live production penetration test.

---

## 14. Final release recommendation

**Ship a restricted pilot** of the Performance Review module under the bounds in §1.

**Do not** declare unrestricted production readiness until O1–O3 are closed with evidence from the real deployment environment.

**Pilot-enabled:** employee/manager assessments with sealing, discussion, acknowledgement (including disagreement), HR quality checklist, finalisation, reopen, cycles/objectives without confidential HOD unlock, dashboard/reports/audit timeline.

**Pilot-excluded / disabled:** HOD confidential calibration until HR decision; reliance on automated deadline emails until cron/mail proven.

---

*Report generated from repository inspection, Batches 1–6 evidence, PHPUnit, Playwright (isolated SQLite), frontend production build, and the scheduler registration fix. Distinguishes verified behaviour from assumptions and unverified production configuration.*
