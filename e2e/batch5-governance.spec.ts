import { test, expect } from "@playwright/test";
import {
  apiRoots,
  authHeaders,
  Batch1Manifest,
  loadManifest,
  loginApi,
  validManagerReview,
} from "./helpers/batch1";

/**
 * Batch 5: HOD (policy-safe), HR quality checklist, finalisation gates, reopen + audit.
 */
test.describe.configure({ mode: "serial" });

test.describe("Batch 5 HOD, quality checks, reopen", () => {
  let manifest: Batch1Manifest;

  test.beforeAll(() => {
    manifest = loadManifest();
    expect(manifest.governance_review_id, "governance_review_id — re-run e2e prepare").toBeTruthy();
    expect(manifest.hod_blocked_review_id).toBeTruthy();
    expect(manifest.hod_ready_review_id).toBeTruthy();
    expect(manifest.users.hod?.email).toBeTruthy();
  });

  test("HOD pathway blocked without policy; self-assessment stays sealed", async ({ request }) => {
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const submit = await request.put(
      `${apiRoots()[1]}/${manifest.hod_blocked_review_id}/manager-review`,
      {
        headers: authHeaders(mgr),
        data: { manager_review: validManagerReview() },
      },
    );
    expect(submit.status(), await submit.text()).toBe(200);
    const body = await submit.json();
    expect(body.status).toBe("hod_review");

    const hod = await loginApi(request, manifest.users.hod!.email, manifest.password);
    const decide = await request.post(
      `${apiRoots()[1]}/${manifest.hod_blocked_review_id}/hod-decide`,
      {
        headers: authHeaders(hod),
        data: { decision: "approved" },
      },
    );
    expect(decide.status()).toBe(403);
    expect((await decide.json()).policy).toBe("blocked_pending_policy");

    const show = await request.get(`${apiRoots()[1]}/${manifest.hod_blocked_review_id}`, {
      headers: authHeaders(hod),
    });
    expect(show.status()).toBe(200);
    const text = await show.text();
    expect(text).not.toContain(manifest.secret_token);
  });

  test("authorised HOD can approve with rating reason; unauthorised denied", async ({
    request,
  }) => {
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const submit = await request.put(
      `${apiRoots()[1]}/${manifest.hod_ready_review_id}/manager-review`,
      {
        headers: authHeaders(mgr),
        data: { manager_review: validManagerReview({ ratings: "3" }) },
      },
    );
    expect(submit.status(), await submit.text()).toBe(200);
    expect((await submit.json()).status).toBe("hod_review");

    const other = await loginApi(
      request,
      manifest.users.other_manager.email,
      manifest.password,
    );
    expect(
      (
        await request.post(`${apiRoots()[1]}/${manifest.hod_ready_review_id}/hod-decide`, {
          headers: authHeaders(other),
          data: { decision: "approved" },
        })
      ).status(),
    ).toBe(403);

    const hod = await loginApi(request, manifest.users.hod!.email, manifest.password);
    const noReason = await request.post(
      `${apiRoots()[1]}/${manifest.hod_ready_review_id}/hod-decide`,
      {
        headers: authHeaders(hod),
        data: { decision: "approved", new_rating: "4" },
      },
    );
    expect(noReason.status()).toBe(422);

    const ok = await request.post(`${apiRoots()[1]}/${manifest.hod_ready_review_id}/hod-decide`, {
      headers: authHeaders(hod),
      data: {
        decision: "approved",
        new_rating: "4",
        rating_change_reason: "E2E calibration against peers",
        notes: "Approved",
      },
    });
    expect(ok.status(), await ok.text()).toBe(200);
    const payload = await ok.json();
    expect(payload.data?.status).toBe("hr_review");
    expect(payload.data?.self_assessment).toBeNull();
    expect(payload.data?.manager_review?.ratings).toBe("4");

    const reload = await request.get(`${apiRoots()[1]}/${manifest.hod_ready_review_id}`, {
      headers: authHeaders(hod),
    });
    const data = (await reload.json()).data ?? (await reload.json());
    expect(data.manager_review?.ratings).toBe("4");
    expect(data.self_assessment).toBeNull();
  });

  test("quality checklist blocks then allows finalisation; reopen preserves history", async ({
    request,
  }) => {
    const reviewId = manifest.governance_review_id!;
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);

    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/discussed`, {
          headers: authHeaders(mgr),
          data: {
            discussion_held: true,
            discussion_summary: "E2E B5 governance discussion summary.",
            agreed_actions: "Follow up",
          },
        })
      ).status(),
    ).toBe(200);

    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/sign`, {
          headers: authHeaders(emp),
          data: { actor: "employee", acknowledged: true, disagrees: false },
        })
      ).status(),
    ).toBe(200);

    const checklist = await request.get(`${apiRoots()[1]}/${reviewId}/quality-checklist`, {
      headers: authHeaders(hr),
    });
    expect(checklist.status()).toBe(200);
    const items = (await checklist.json()).data?.items;
    expect(items?.discussion_recorded?.status).toBe("complete");
    expect(items?.employee_acknowledgement?.status).toBe("complete");
    expect(items?.hr_manual_confirmation?.status).toBe("incomplete");

    const blocked = await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
      headers: authHeaders(hr),
      data: {
        hr_review: {
          overall_assessment: "E2E_B5_FINAL",
          review_adequacy: "OK",
          development_recommendations: "OK",
          final_comments: "Done",
          final_rating: "3",
        },
      },
    });
    expect(blocked.status()).toBe(422);
    const blockBody = await blocked.json();
    expect(JSON.stringify(blockBody.blocking || [])).toContain("hr_manual_confirmation");

    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/quality-checklist`, {
          headers: authHeaders(hr),
          data: { manual_confirmations: { checklist_reviewed: true } },
        })
      ).status(),
    ).toBe(200);

    const complete = await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
      headers: authHeaders(hr),
      data: {
        hr_review: {
          overall_assessment: "E2E_B5_FINAL",
          review_adequacy: "OK",
          development_recommendations: "OK",
          final_comments: "Done",
          final_rating: "3",
        },
      },
    });
    expect(complete.status(), await complete.text()).toBe(200);

    const empView = await request.get(`${apiRoots()[1]}/${reviewId}`, {
      headers: authHeaders(emp),
    });
    expect((await empView.json()).data?.status ?? (await empView.json()).status).toBe("completed");

    expect(
      (
        await request.post(`${apiRoots()[1]}/${reviewId}/reopen`, {
          headers: authHeaders(emp),
          data: { reason: "I want changes", return_to_status: "manager_review" },
        })
      ).status(),
    ).toBe(403);

    expect(
      (
        await request.post(`${apiRoots()[1]}/${reviewId}/reopen`, {
          headers: authHeaders(hr),
          data: { reason: "ab", return_to_status: "manager_review" },
        })
      ).status(),
    ).toBe(422);

    const reopen = await request.post(`${apiRoots()[1]}/${reviewId}/reopen`, {
      headers: authHeaders(hr),
      data: {
        reason: "E2E correction after factual error",
        return_to_status: "manager_review",
      },
    });
    expect(reopen.status(), await reopen.text()).toBe(200);
    const reopened = (await reopen.json()).data;
    expect(reopened.status).toBe("manager_review");
    expect(reopened.status_before_reopen).toBe("completed");

    const revisions = await request.get(`${apiRoots()[1]}/${reviewId}/revisions`, {
      headers: authHeaders(hr),
    });
    expect(revisions.status()).toBe(200);
    const revs = (await revisions.json()).data || [];
    expect(revs.length).toBeGreaterThan(0);
    expect(revs[0].manager_review?.comments).toBe("E2E_GOV_RATIONALE");
    expect(revs[0].hr_review?.overall_assessment).toBe("E2E_B5_FINAL");
  });

  test("employee and unassigned manager cannot finalise or reopen", async ({ request }) => {
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);
    const other = await loginApi(
      request,
      manifest.users.other_manager.email,
      manifest.password,
    );
    const id = manifest.hod_ready_review_id!;

    expect(
      (
        await request.put(`${apiRoots()[1]}/${id}/complete`, {
          headers: authHeaders(emp),
          data: { hr_review: { overall_assessment: "nope" } },
        })
      ).status(),
    ).toBe(403);

    expect(
      (
        await request.post(`${apiRoots()[1]}/${id}/reopen`, {
          headers: authHeaders(other),
          data: { reason: "Should not work here", return_to_status: "manager_review" },
        })
      ).status(),
    ).toBe(403);
  });
});
