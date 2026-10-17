import { test, expect } from "@playwright/test";
import {
  apiRoots,
  authHeaders,
  Batch1Manifest,
  loadManifest,
  loginApi,
  loginUi,
} from "./helpers/batch1";

/**
 * Batch 2: discussion record, employee acknowledgement (receipt ≠ agreement), disagreement.
 * Batch 5 sequence: acknowledgement after discussion, before HR finalisation + quality checklist.
 * Uses discussion_review_id from the shared E2E SQLite prepare script.
 */
test.describe.configure({ mode: "serial" });

test.describe("Batch 2 discussion and acknowledgement", () => {
  let manifest: Batch1Manifest;
  let reviewId: number;

  test.beforeAll(() => {
    manifest = loadManifest();
    reviewId = manifest.discussion_review_id!;
    expect(reviewId, "discussion_review_id missing — re-run e2e prepare").toBeTruthy();
  });

  test("manager records discussion via API and it persists", async ({ request }) => {
    const token = await loginApi(request, manifest.users.manager.email, manifest.password);

    const fail = await request.put(`${apiRoots()[1]}/${reviewId}/discussed`, {
      headers: authHeaders(token),
      data: { discussion_held: true, discussion_summary: "" },
    });
    expect(fail.status()).toBe(422);

    const ok = await request.put(`${apiRoots()[1]}/${reviewId}/discussed`, {
      headers: authHeaders(token),
      data: {
        discussion_held: true,
        discussion_summary: "E2E discussion summary of strengths and priorities.",
        agreed_actions: "Complete documentation training by November.",
      },
    });
    expect(ok.status(), await ok.text()).toBe(200);
    const body = await ok.json();
    expect(body.discussion_completed_at).toBeTruthy();
    expect(String(body.meeting_notes)).toContain("E2E discussion summary");
    expect(body.self_assessment?.achievements).toBe(manifest.secret_token);
    expect(body.manager_review?.ratings).toBe("3");

    const reload = await request.get(`${apiRoots()[1]}/${reviewId}`, {
      headers: authHeaders(token),
    });
    expect(reload.status()).toBe(200);
    const data = (await reload.json()).data ?? (await reload.json());
    expect(data.discussion_completed_at).toBeTruthy();
    expect(String(data.meeting_notes)).toContain("Agreed actions");
  });

  test("unassigned manager and peer cannot record discussion or acknowledge", async ({
    request,
  }) => {
    const other = await loginApi(
      request,
      manifest.users.other_manager.email,
      manifest.password,
    );
    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/discussed`, {
          headers: authHeaders(other),
          data: { discussion_held: true, discussion_summary: "Nope" },
        })
      ).status(),
    ).toBe(403);

    const peer = await loginApi(request, manifest.users.peer.email, manifest.password);
    expect(
      (
        await request.put(`${apiRoots()[1]}/${reviewId}/sign`, {
          headers: authHeaders(peer),
          data: { actor: "employee", acknowledged: true, disagrees: false },
        })
      ).status(),
    ).toBe(403);
  });

  test("employee can acknowledge after discussion before finalisation", async ({ request }) => {
    const token = await loginApi(request, manifest.users.employee.email, manifest.password);
    const res = await request.put(`${apiRoots()[0]}/${reviewId}/sign`, {
      headers: authHeaders(token),
      data: {
        actor: "employee",
        acknowledged: true,
        comments: "I received the review and discussed it.",
        disagrees: true,
        disagreement_explanation: "E2E_DISAGREE_REASON",
      },
    });
    expect(res.status(), await res.text()).toBe(200);
    const body = await res.json();
    expect(body.employee_acknowledgement?.acknowledged).toBe(true);
    expect(body.employee_acknowledgement?.means_agreement).toBe(false);
    expect(body.employee_acknowledgement?.disagrees).toBe(true);
    expect(body.employee_acknowledgement?.disagreement_explanation).toBe("E2E_DISAGREE_REASON");
    expect(body.manager_review?.ratings).toBe("3");
    expect(body.self_assessment?.achievements).toBe(manifest.secret_token);
  });

  test("repeat acknowledgement rejected; HR quality-check then finalise", async ({ request }) => {
    const employee = await loginApi(
      request,
      manifest.users.employee.email,
      manifest.password,
    );
    const again = await request.put(`${apiRoots()[1]}/${reviewId}/sign`, {
      headers: authHeaders(employee),
      data: {
        actor: "employee",
        acknowledged: true,
        comments: "Follow-up note",
      },
    });
    expect(again.status()).toBe(422);

    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);
    const blocked = await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
      headers: authHeaders(hr),
      data: {
        hr_review: {
          overall_assessment: "E2E_HR_FINAL",
          review_adequacy: "Adequate",
          development_recommendations: "Mentoring",
          final_comments: "Closed for E2E",
          final_rating: "3",
        },
      },
    });
    expect(blocked.status()).toBe(422);

    const qc = await request.put(`${apiRoots()[1]}/${reviewId}/quality-checklist`, {
      headers: authHeaders(hr),
      data: { manual_confirmations: { checklist_reviewed: true } },
    });
    expect(qc.status(), await qc.text()).toBe(200);

    const complete = await request.put(`${apiRoots()[1]}/${reviewId}/complete`, {
      headers: authHeaders(hr),
      data: {
        hr_review: {
          overall_assessment: "E2E_HR_FINAL",
          review_adequacy: "Adequate",
          development_recommendations: "Mentoring",
          final_comments: "Closed for E2E",
          final_rating: "3",
        },
      },
    });
    expect(complete.status(), await complete.text()).toBe(200);

    const reload = await request.get(`${apiRoots()[1]}/${reviewId}`, {
      headers: authHeaders(employee),
    });
    expect(reload.status()).toBe(200);
    const data = (await reload.json()).data ?? (await reload.json());
    expect(data.status).toBe("completed");
    expect(data.employee_acknowledgement?.disagrees).toBe(true);
    expect(data.employee_acknowledgement?.disagreement_explanation).toBe("E2E_DISAGREE_REASON");
    expect(data.manager_review?.ratings).toBe("3");
  });

  test("UI: manager discussion form persists after reload", async ({ page }) => {
    await loginUi(page, manifest.users.manager.email, manifest.password);
    await page.goto(`/performance/${reviewId}`);
    await expect(page.getByRole("button", { name: /discussion/i }).first()).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: /discussion/i }).first().click();
    await expect(page.getByText(/E2E discussion summary|Discussion record saved/i).first()).toBeVisible({
      timeout: 15_000,
    });

    await page.reload();
    await page.getByRole("button", { name: /discussion/i }).first().click();
    await expect(page.getByText(/E2E discussion summary|Agreed actions/i).first()).toBeVisible();
  });

  test("UI: employee acknowledgement shows receipt language and disagreement", async ({
    page,
  }) => {
    await loginUi(page, manifest.users.employee.email, manifest.password);
    await page.goto(`/performance/${reviewId}`);
    await page.getByRole("button", { name: /acknowledgement/i }).first().click();
    await expect(
      page.getByText(/does not necessarily mean that I agree/i).first(),
    ).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/E2E_DISAGREE_REASON|Yes/i).first()).toBeVisible();
    await expect(page.getByText(manifest.secret_token)).toHaveCount(0);
  });
});
