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
 * Batch 1: assessment independence + assigned-manager ACL.
 * Asserts protected content is absent from unauthorised API responses
 * and that the UI shows sealed messaging (not merely CSS-hidden fields).
 *
 * Serial order matters: UI sealed checks run before the manager-submit mutation.
 */
test.describe.configure({ mode: "serial" });

test.describe("Batch 1 performance review independence", () => {
  let manifest: Batch1Manifest;

  test.beforeAll(() => {
    manifest = loadManifest();
  });

  for (const root of apiRoots()) {
    test(`API sealing before manager submit (${root})`, async ({ request }) => {
      const managerToken = await loginApi(
        request,
        manifest.users.manager.email,
        manifest.password,
      );

      const detail = await request.get(`${root}/${manifest.review_id}`, {
        headers: authHeaders(managerToken),
      });
      expect(detail.status(), await detail.text()).toBe(200);
      const detailBody = await detail.json();
      const data = detailBody.data ?? detailBody;
      const raw = JSON.stringify(detailBody);

      expect(data.self_assessment_sealed).toBe(true);
      expect(data.self_assessment).toBeNull();
      expect(raw).not.toContain(manifest.secret_token);
      expect(raw).not.toContain(`${manifest.secret_token}_COMMENT`);
      expect(raw).not.toContain(`${manifest.secret_token}_DRAFT`);

      const list = await request.get(root, {
        headers: authHeaders(managerToken),
      });
      expect(list.status()).toBe(200);
      const listJson = await list.json();
      const rows = Array.isArray(listJson) ? listJson : listJson.data;
      const row = (rows as any[]).find((r) => r.id === manifest.review_id);
      expect(row).toBeTruthy();
      expect(row.self_assessment_sealed).toBe(true);
      expect(row.self_assessment).toBeNull();
      expect(JSON.stringify(row)).not.toContain(manifest.secret_token);
    });
  }

  test("other same-department manager cannot view or act via API", async ({ request }) => {
    const token = await loginApi(
      request,
      manifest.users.other_manager.email,
      manifest.password,
    );

    for (const root of apiRoots()) {
      const show = await request.get(`${root}/${manifest.review_id}`, {
        headers: authHeaders(token),
      });
      expect(show.status(), await show.text()).toBe(403);

      const act = await request.put(`${root}/${manifest.review_id}/manager-review`, {
        headers: authHeaders(token),
        data: {
          manager_review: {
            performance_assessment: "Unauthorised attempt",
            ratings: "3",
            comments: "Should fail",
            strengths: "x",
            areas_for_improvement: "y",
            recommendations: "z",
          },
        },
      });
      expect(act.status()).toBe(403);
    }
  });

  test("peer employee cannot retrieve another employee review via API", async ({ request }) => {
    const token = await loginApi(request, manifest.users.peer.email, manifest.password);

    for (const root of apiRoots()) {
      const show = await request.get(`${root}/${manifest.review_id}`, {
        headers: authHeaders(token),
      });
      expect(show.status()).toBe(403);
    }

    const list = await request.get(apiRoots()[1], {
      headers: authHeaders(token),
    });
    expect(list.status()).toBe(200);
    const rows = await list.json();
    const ids = (Array.isArray(rows) ? rows : []).map((r: any) => r.id);
    expect(ids).not.toContain(manifest.review_id);
  });

  test("employee cannot see manager assessment before manager submits", async ({ request }) => {
    const token = await loginApi(
      request,
      manifest.users.employee.email,
      manifest.password,
    );
    const show = await request.get(`${apiRoots()[1]}/${manifest.review_id}`, {
      headers: authHeaders(token),
    });
    expect(show.status()).toBe(200);
    const body = await show.json();
    const data = body.data ?? body;
    expect(data.manager_review_sealed).toBe(true);
    expect(data.manager_review).toBeNull();
    expect(body.workflow?.manager_review_visible).toBe(false);
  });

  test("UI: manager sees sealed self-assessment; network payload omits secret", async ({
    page,
  }) => {
    await loginUi(page, manifest.users.manager.email, manifest.password);

    let intercepted: any = null;
    page.on("response", async (response) => {
      const url = response.url();
      if (
        url.includes(`/performance/${manifest.review_id}`) &&
        response.request().method() === "GET" &&
        response.status() === 200
      ) {
        try {
          intercepted = await response.json();
        } catch {
          /* ignore non-json */
        }
      }
    });

    await page.goto(`/performance/${manifest.review_id}`);
    await expect(
      page.getByText(/line manager assessment|employee self-assessment/i).first(),
    ).toBeVisible({ timeout: 30_000 });

    await expect.poll(() => intercepted !== null, { timeout: 20_000 }).toBeTruthy();
    const payload = intercepted.data ?? intercepted;
    const raw = JSON.stringify(intercepted);
    expect(payload.self_assessment_sealed).toBe(true);
    expect(payload.self_assessment).toBeNull();
    expect(raw).not.toContain(manifest.secret_token);
    await expect(
      page.getByText(/sealed until you submit|ratings and comments are hidden/i).first(),
    ).toBeVisible();
  });

  test("UI: unauthorised manager cannot open review by direct navigation", async ({
    page,
    request,
  }) => {
    await loginUi(page, manifest.users.other_manager.email, manifest.password);

    // Server-side check with the same credentials the UI just used.
    const otherToken = await loginApi(
      request,
      manifest.users.other_manager.email,
      manifest.password,
    );
    const apiDenied = await request.get(`${apiRoots()[1]}/${manifest.review_id}`, {
      headers: authHeaders(otherToken),
    });
    expect(apiDenied.status()).toBe(403);
    expect(await apiDenied.text()).not.toContain(manifest.secret_token);

    const detailResponses: number[] = [];
    page.on("response", (response) => {
      const url = response.url();
      // Only the API detail call — not the SPA document navigation to /performance/:id.
      if (
        response.request().method() === "GET" &&
        /\/api\/performance\/\d+(\?|$)/.test(url) &&
        url.includes(`/performance/${manifest.review_id}`)
      ) {
        detailResponses.push(response.status());
      }
    });

    await page.goto(`/performance/${manifest.review_id}`);
    await expect.poll(() => detailResponses.length > 0, { timeout: 20_000 }).toBeTruthy();
    expect(detailResponses).toEqual(expect.arrayContaining([403]));
    expect(detailResponses.every((s) => s === 403)).toBeTruthy();

    await expect(page.getByText(/couldn't open this review/i)).toBeVisible({
      timeout: 20_000,
    });
    await expect(page.getByText(manifest.secret_token)).toHaveCount(0);
  });

  test("N/A rating without explanation is rejected by API", async ({ request }) => {
    const managerToken = await loginApi(
      request,
      manifest.users.manager.email,
      manifest.password,
    );

    const fail = await request.put(`${apiRoots()[1]}/${manifest.na_review_id}/manager-review`, {
      headers: authHeaders(managerToken),
      data: {
        manager_review: {
          ratings: "N/A",
          performance_assessment: "",
          comments: "",
          observations: "",
          strengths: "x",
          areas_for_improvement: "y",
          recommendations: "z",
        },
      },
    });
    expect(fail.status()).toBe(422);

    const ok = await request.put(`${apiRoots()[1]}/${manifest.na_review_id}/manager-review`, {
      headers: authHeaders(managerToken),
      data: {
        manager_review: {
          ratings: "N/A",
          performance_assessment: "Not applicable this cycle.",
          comments: "Explanation for N/A",
          strengths: "x",
          areas_for_improvement: "y",
          recommendations: "z",
        },
      },
    });
    expect(ok.status(), await ok.text()).toBe(200);
    expect((await ok.json()).manager_review?.ratings).toBe("N/A");
  });

  test("after manager submit: visibility rules and separate assessments", async ({ request }) => {
    const managerToken = await loginApi(
      request,
      manifest.users.manager.email,
      manifest.password,
    );

    const submit = await request.put(
      `${apiRoots()[1]}/${manifest.review_id}/manager-review`,
      {
        headers: authHeaders(managerToken),
        data: {
          manager_review: {
            performance_assessment: "Independent manager assessment evidence.",
            strengths: "Delivery",
            areas_for_improvement: "Documentation",
            recommendations: "Coaching — manager — 2026-12-01",
            ratings: "3",
            comments: "MANAGER_ONLY_RATIONALE",
          },
        },
      },
    );
    expect(submit.status(), await submit.text()).toBe(200);
    const submitted = await submit.json();
    expect(submitted.status).toBe("hr_review");
    expect(submitted.self_assessment_sealed).toBe(false);
    expect(submitted.self_assessment?.achievements).toBe(manifest.secret_token);
    expect(submitted.manager_review?.comments).toBe("MANAGER_ONLY_RATIONALE");
    expect(submitted.self_assessment?.achievements).not.toBe(
      submitted.manager_review?.performance_assessment,
    );

    const employeeToken = await loginApi(
      request,
      manifest.users.employee.email,
      manifest.password,
    );
    const employeeView = await request.get(`${apiRoots()[1]}/${manifest.review_id}`, {
      headers: authHeaders(employeeToken),
    });
    expect(employeeView.status()).toBe(200);
    const empBody = await employeeView.json();
    const empData = empBody.data ?? empBody;
    expect(empData.manager_review_sealed).toBe(false);
    expect(empData.manager_review?.ratings).toBe("3");
    expect(empData.hr_review_sealed).toBe(true);
    expect(empData.hr_review).toBeNull();
  });
});
