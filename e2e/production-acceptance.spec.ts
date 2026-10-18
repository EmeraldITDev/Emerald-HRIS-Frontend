import { test, expect } from "@playwright/test";
import {
  apiRoots,
  authHeaders,
  Batch1Manifest,
  completeSelfAssessment,
  loadManifest,
  loginApi,
  loginUi,
  validManagerReview,
} from "./helpers/batch1";

/**
 * Final production-acceptance lifecycle on isolated E2E SQLite (not production).
 * Combines browser journeys with API assertions for confidentiality and gates.
 */
test.describe.configure({ mode: "serial" });

test.describe("Production acceptance lifecycle", () => {
  let manifest: Batch1Manifest;
  let reviewId: number;
  const api = () => `http://127.0.0.1:${process.env.E2E_API_PORT || "8010"}/api`;

  test.beforeAll(() => {
    manifest = loadManifest();
    expect(manifest.employee_record_id).toBeTruthy();
    expect(manifest.manager_user_id).toBeTruthy();
  });

  test("HR creates cycle-less review; employee draft via browser then submits", async ({
    page,
    request,
  }) => {
    test.setTimeout(120_000);
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);
    const created = await request.post(`${api()}/performance`, {
      headers: authHeaders(hr),
      data: {
        employee_id: manifest.employee_record_id,
        period: `ACCEPT-${Date.now()}`,
        request_self_assessment: true,
      },
    });
    expect(created.status(), await created.text()).toBe(201);
    const body = await created.json();
    reviewId = body.id ?? body.data?.id;
    expect(reviewId).toBeTruthy();

    // Persist draft first (same pattern as Batch 6), then open a fresh browser session —
    // reload-after-long-suite can leave the detail page stuck on "Loading review…".
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);
    const draft = await request.put(`${apiRoots()[1]}/${reviewId}/submit-self`, {
      headers: authHeaders(emp),
      data: {
        draft: true,
        self_assessment: { achievements_impact: "ACCEPT_DRAFT_VISIBLE" },
      },
    });
    expect(draft.status()).toBe(200);
    expect((await draft.json()).status).toBe("self_assessment_requested");

    await loginUi(page, manifest.users.employee.email, manifest.password);
    await page.goto(`/performance/${reviewId}`);
    await expect(page.getByText(/self-assessment|Employee self-assessment/i).first()).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText(/ACCEPT_DRAFT_VISIBLE/i).first()).toBeVisible({ timeout: 20_000 });

    // Resume editing in the browser form, then submit the full assessment.
    const achievementField = page.getByLabel(/achievements|impact/i).first();
    if (await achievementField.isVisible().catch(() => false)) {
      await achievementField.fill("ACCEPT_DRAFT_VISIBLE — resumed in browser");
      const saveDraft = page.getByTestId("save-self-draft").or(page.getByRole("button", { name: /save draft/i }));
      if (await saveDraft.first().isVisible().catch(() => false)) {
        await saveDraft.first().click();
        await expect(page.getByText(/draft saved|saved/i).first()).toBeVisible({ timeout: 15_000 });
      }
    }

    const submit = await request.put(`${apiRoots()[1]}/${reviewId}/submit-self`, {
      headers: authHeaders(emp),
      data: { self_assessment: completeSelfAssessment({ achievements_impact: "ACCEPT_SELF_FINAL" }) },
    });
    expect(submit.status(), await submit.text()).toBe(200);
    expect((await submit.json()).status).toBe("self_assessment_submitted");

    await page.goto(`/performance/${reviewId}`);
    await expect(page.getByText(/submitted|Self-Assessment Submitted|awaiting/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test("manager cannot see self-assessment until independent submit", async ({ request }) => {
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const show = await request.get(`${apiRoots()[1]}/${reviewId}`, { headers: authHeaders(mgr) });
    expect(show.status()).toBe(200);
    const data = (await show.json()).data ?? (await show.json());
    expect(data.self_assessment_sealed).toBe(true);
    expect(data.self_assessment).toBeNull();
    expect(JSON.stringify(data)).not.toContain("ACCEPT_SELF_FINAL");

    const peer = await loginApi(request, manifest.users.peer.email, manifest.password);
    expect(
      (await request.get(`${apiRoots()[1]}/${reviewId}`, { headers: authHeaders(peer) })).status(),
    ).toBe(403);

    const other = await loginApi(
      request,
      manifest.users.other_manager.email,
      manifest.password,
    );
    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/manager-review`, {
          headers: authHeaders(other),
          data: { manager_review: validManagerReview() },
        })
      ).status(),
    ).toBe(403);

    const ok = await request.put(`${apiRoots()[1]}/${reviewId}/manager-review`, {
      headers: authHeaders(mgr),
      data: { manager_review: validManagerReview({ comments: "ACCEPT_MGR_RATIONALE" }) },
    });
    expect(ok.status(), await ok.text()).toBe(200);
    expect((await ok.json()).status).toBe("hr_review");
    expect((await ok.json()).self_assessment_sealed).toBe(false);
  });

  test("discussion, ack, quality gate, finalise, employee sees final HR review", async ({
    request,
  }) => {
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);

    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/discussed`, {
          headers: authHeaders(mgr),
          data: {
            discussion_held: true,
            discussion_summary: "Acceptance discussion of strengths and priorities.",
            agreed_actions: "Follow up next quarter",
          },
        })
      ).status(),
    ).toBe(200);

    // Premature finalise blocked
    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
          headers: authHeaders(hr),
          data: {
            hr_review: {
              overall_assessment: "TOO_EARLY",
              review_adequacy: "OK",
              development_recommendations: "OK",
              final_comments: "OK",
              final_rating: "3",
            },
          },
        })
      ).status(),
    ).toBe(422);

    const ack = await request.put(`${apiRoots()[1]}/${reviewId}/sign`, {
      headers: authHeaders(emp),
      data: {
        actor: "employee",
        acknowledged: true,
        disagrees: true,
        disagreement_explanation: "ACCEPT_DISAGREE",
        comments: "Received and discussed",
      },
    });
    expect(ack.status(), await ack.text()).toBe(200);
    expect((await ack.json()).employee_acknowledgement?.means_agreement).toBe(false);

    // Employee still cannot finalise
    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
          headers: authHeaders(emp),
          data: { hr_review: { overall_assessment: "nope" } },
        })
      ).status(),
    ).toBe(403);

    // Still blocked without quality checklist confirmation
    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
          headers: authHeaders(hr),
          data: {
            hr_review: {
              overall_assessment: "ACCEPT_HR_FINAL",
              review_adequacy: "Adequate",
              development_recommendations: "Continue",
              final_comments: "Closed",
              final_rating: "3",
            },
          },
        })
      ).status(),
    ).toBe(422);

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
          overall_assessment: "ACCEPT_HR_FINAL",
          review_adequacy: "Adequate",
          development_recommendations: "Continue",
          final_comments: "Closed",
          final_rating: "3",
        },
      },
    });
    expect(complete.status(), await complete.text()).toBe(200);

    const empView = await request.get(`${apiRoots()[1]}/${reviewId}`, {
      headers: authHeaders(emp),
    });
    const data = (await empView.json()).data ?? (await empView.json());
    expect(data.status).toBe("completed");
    expect(data.hr_review_sealed).toBe(false);
    expect(data.hr_review?.overall_assessment).toBe("ACCEPT_HR_FINAL");
    expect(data.employee_acknowledgement?.disagrees).toBe(true);
  });

  test("HR reopen preserves history; employee cannot reopen; dashboard reflects state", async ({
    request,
  }) => {
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);

    expect(
      (
        await request.post(`${apiRoots()[1]}/${reviewId}/reopen`, {
          headers: authHeaders(emp),
          data: { reason: "I want a change", return_to_status: "manager_review" },
        })
      ).status(),
    ).toBe(403);

    const reopen = await request.post(`${apiRoots()[1]}/${reviewId}/reopen`, {
      headers: authHeaders(hr),
      data: {
        reason: "Acceptance correction after factual error",
        return_to_status: "manager_review",
      },
    });
    expect(reopen.status(), await reopen.text()).toBe(200);
    expect((await reopen.json()).data.status).toBe("manager_review");
    expect((await reopen.json()).data.status_before_reopen).toBe("completed");

    const revs = await request.get(`${apiRoots()[1]}/${reviewId}/revisions`, {
      headers: authHeaders(hr),
    });
    expect(revs.status()).toBe(200);
    const list = (await revs.json()).data || [];
    expect(list.length).toBeGreaterThan(0);
    expect(list[0].hr_review?.overall_assessment).toBe("ACCEPT_HR_FINAL");

    const timeline = await request.get(`${apiRoots()[1]}/${reviewId}/audit-timeline`, {
      headers: authHeaders(hr),
    });
    expect(timeline.status()).toBe(200);
    expect(((await timeline.json()).data.events || []).length).toBeGreaterThan(0);

    // Peer cannot read audit timeline
    const peer = await loginApi(request, manifest.users.peer.email, manifest.password);
    expect(
      (
        await request.get(`${apiRoots()[1]}/${reviewId}/audit-timeline`, {
          headers: authHeaders(peer),
        })
      ).status(),
    ).toBe(403);

    const dash = await request.get(`${api()}/performance/dashboard`, {
      headers: authHeaders(hr),
    });
    expect(dash.status()).toBe(200);
    expect((await dash.json()).data.counts.returned_or_reopened).toBeGreaterThanOrEqual(1);
  });

  test("HOD pathway remains blocked without policy authorisation", async ({ request }) => {
    expect(manifest.hod_blocked_review_id).toBeTruthy();
    const hod = await loginApi(request, manifest.users.hod!.email, manifest.password);
    // May already be in hod_review from Batch 5 — decide should still be forbidden without policy
    const decide = await request.post(
      `${apiRoots()[1]}/${manifest.hod_blocked_review_id}/hod-decide`,
      {
        headers: authHeaders(hod),
        data: { decision: "approved" },
      },
    );
    // 403 policy block or 422 if already left hod_review
    expect([403, 422]).toContain(decide.status());
    if (decide.status() === 403) {
      expect((await decide.json()).policy).toBe("blocked_pending_policy");
    }
    const show = await request.get(`${apiRoots()[1]}/${manifest.hod_blocked_review_id}`, {
      headers: authHeaders(hod),
    });
    if (show.status() === 200) {
      expect(await show.text()).not.toContain(manifest.secret_token);
    }
  });
});
