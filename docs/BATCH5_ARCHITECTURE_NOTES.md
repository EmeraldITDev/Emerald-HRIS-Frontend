# Batch 5 — Architecture notes (pre-implementation)

## Workflow gaps found

| Area | Current | Required |
|---|---|---|
| HOD | Flag only on cycles | Operational approval stage when lawfully enabled |
| Ack timing | Only after `completed` | After discussion, before finalisation |
| Finalise gates | Discussion + light HR content | Full quality checklist + ack + objectives + HOD |
| Reopen | None | HR-only + reason + snapshot history |
| Audit | Best-effort `safeAuditLog` | Durable for critical events |

## Policy P1 (confidential HOD access) — unresolved

Guide §3 vs §12 conflict: HOD calibration vs “sensitive reviews → HR & line manager only”.

**Decision for Batch 5 (matches audit P1):**

- Do **not** expose employee `self_assessment` to HOD users.
- HOD may calibrate/approve the **manager** assessment only when `hod_confidential_access_authorised` is true on the cycle.
- Until that flag is set, HOD decision APIs return 403 and finalisation is blocked if the cycle requires HOD approval.
- HR must confirm in writing whether HODs may see self-assessments before broadening access.

## Status additions (backward compatible)

- `hod_review` — awaiting authorised HOD decision  
- Existing `hr_review` / `completed` retained  
- `hod_status` on review: `not_required` | `pending` | `approved` | `returned` | `blocked_pending_policy`

## Ack sequence fix

`canAcknowledge`: `hr_review` + discussion recorded + not yet acknowledged.  
`complete()` requires acknowledgement record.

## Post-implementation

See `docs/BATCH5_VERIFICATION_EVIDENCE.md`. Classification: **Partially Verified** (HOD live confidential pathway blocked pending HR policy).
