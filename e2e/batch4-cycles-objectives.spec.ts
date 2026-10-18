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
 * Batch 4: review cycle administration + structured objectives.
 */
test.describe.configure({ mode: "serial" });

test.describe("Batch 4 cycles and objectives", () => {
  let manifest: Batch1Manifest;
  let cycleId: number;
  let objectivesReviewId: number;
  let objectiveId: number;

  test.beforeAll(() => {
    manifest = loadManifest();
    objectivesReviewId = manifest.objectives_review_id!;
    expect(objectivesReviewId, "objectives_review_id missing — re-run e2e prepare").toBeTruthy();
    expect(manifest.employee_record_id, "employee_record_id missing").toBeTruthy();
  });

  test("HR creates cycle, previews roster, opens idempotently", async ({ request }) => {
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);
    const root = apiRoots()[1];

    const unauth = await loginApi(request, manifest.users.manager.email, manifest.password);
    expect(
      (
        await request.post(`${root}/cycles`, {
          headers: authHeaders(unauth),
          data: { name: "Nope" },
        })
      ).status(),
    ).toBe(403);

    const badDates = await request.post(`${root}/cycles`, {
      headers: authHeaders(hr),
      data: {
        name: "Bad",
        period_label: "BAD",
        coverage_start_date: "2026-06-01",
        coverage_end_date: "2026-01-01",
        eligible_employee_ids: [manifest.employee_record_id],
      },
    });
    expect(badDates.status()).toBe(422);

    const create = await request.post(`${root}/cycles`, {
      headers: authHeaders(hr),
      data: {
        name: "E2E Mid-Year",
        period_label: "E2E-B4-CYCLE",
        coverage_start_date: "2026-01-01",
        coverage_end_date: "2026-06-30",
        self_assessment_deadline: "2026-07-15",
        manager_assessment_deadline: "2026-07-31",
        discussion_deadline: "2026-08-15",
        eligible_employee_ids: [manifest.employee_record_id],
        eligible_departments: [],
        hod_approval_required: true,
        reminder_schedule: { note: "config only", execution: "not_claimed" },
      },
    });
    expect(create.status(), await create.text()).toBe(201);
    const created = await create.json();
    cycleId = created.data.id;
    expect(created.data.hod_approval_required).toBe(true);

    const preview = await request.post(`${root}/cycles/${cycleId}/preview`, {
      headers: authHeaders(hr),
    });
    expect(preview.status(), await preview.text()).toBe(200);
    const previewBody = await preview.json();
    expect(previewBody.summary.ok).toBeGreaterThanOrEqual(1);
    expect(previewBody.summary.missing_manager).toBe(0);
    expect(previewBody.data.status).toBe("ready");
    expect(String(previewBody.notes.hod_workflow)).toContain("not operational");

    const open1 = await request.post(`${root}/cycles/${cycleId}/open`, {
      headers: authHeaders(hr),
    });
    expect(open1.status(), await open1.text()).toBe(200);
    const open1Body = await open1.json();
    expect(open1Body.data.status).toBe("open");
    expect(open1Body.launch.created).toBeGreaterThanOrEqual(1);

    const open2 = await request.post(`${root}/cycles/${cycleId}/open`, {
      headers: authHeaders(hr),
    });
    expect(open2.status()).toBe(200);
    expect((await open2.json()).launch.created).toBe(0);

    const show = await request.get(`${root}/cycles/${cycleId}`, {
      headers: authHeaders(hr),
    });
    expect(show.status()).toBe(200);
    const roster = (await show.json()).data.roster || [];
    expect(roster.length).toBeGreaterThanOrEqual(1);
    expect(roster.some((r: any) => r.review_id)).toBeTruthy();
  });

  test("UI: HR cycle admin page shows saved cycle from API", async ({ page, request }) => {
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);
    // Ensure a cycle exists for the list UI (API path already verified above).
    if (!cycleId) {
      const created = await request.post(`${apiRoots()[1]}/cycles`, {
        headers: authHeaders(hr),
        data: {
          name: "E2E UI Cycle",
          period_label: "E2E-B4-UI",
          coverage_start_date: "2026-01-01",
          coverage_end_date: "2026-06-30",
          eligible_employee_ids: [manifest.employee_record_id],
        },
      });
      expect(created.status()).toBe(201);
      cycleId = (await created.json()).data.id;
    }

    await loginUi(page, manifest.users.hr.email, manifest.password);
    await page.goto("/performance/cycles");
    await expect(page.getByTestId("performance-cycles-page")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("cycle-name")).toBeVisible();
    await expect(page.getByTestId(`cycle-row-${cycleId}`)).toBeVisible({ timeout: 20_000 });
    await page.getByTestId(`cycle-row-${cycleId}`).scrollIntoViewIfNeeded();
    await page.getByTestId(`cycle-row-${cycleId}`).click();
    await expect(page.getByTestId("cycle-detail")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByTestId("cycle-roster")).toBeVisible();
  });

  test("objectives: create, dual agree, amend with history, ACL", async ({ request }) => {
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);
    const other = await loginApi(request, manifest.users.other_manager.email, manifest.password);
    const root = apiRoots()[1];
    const rid = objectivesReviewId;

    expect(
      (
        await request.post(`${root}/${rid}/objectives`, {
          headers: authHeaders(other),
          data: { title: "Unauthorised" },
        })
      ).status(),
    ).toBe(403);

    const create = await request.post(`${root}/${rid}/objectives`, {
      headers: authHeaders(mgr),
      data: {
        title: "E2E Deliver reporting pack",
        success_measure: "Pack published monthly",
        target: "100% on time",
        due_date: "2026-06-30",
        support_requirements: "BI access",
      },
    });
    expect(create.status(), await create.text()).toBe(201);
    const createdObj = await create.json();
    objectiveId = createdObj.data.id;
    expect(createdObj.data.is_agreed).toBeFalsy();

    const empList = await request.get(`${root}/${rid}/objectives`, {
      headers: authHeaders(emp),
    });
    expect(empList.status()).toBe(200);
    expect((await empList.json()).data[0].title).toContain("reporting pack");

    await request.post(`${root}/${rid}/objectives/${objectiveId}/agree`, {
      headers: authHeaders(emp),
    });
    let mid = await request.get(`${root}/${rid}/objectives`, { headers: authHeaders(emp) });
    expect((await mid.json()).data[0].is_agreed).toBeFalsy();

    const mgrAgree = await request.post(`${root}/${rid}/objectives/${objectiveId}/agree`, {
      headers: authHeaders(mgr),
    });
    expect(mgrAgree.status()).toBe(200);
    expect((await mgrAgree.json()).data.is_agreed).toBeTruthy();

    const silent = await request.put(`${root}/${rid}/objectives/${objectiveId}`, {
      headers: authHeaders(mgr),
      data: { title: "Silent overwrite" },
    });
    expect(silent.status()).toBe(422);

    const amend = await request.post(`${root}/${rid}/objectives/${objectiveId}/amend`, {
      headers: authHeaders(mgr),
      data: {
        title: "E2E Deliver reporting pack (revised)",
        change_reason: "Scope clarified with manager on 2026-05-01",
        change_agreed: true,
        change_agreed_at: "2026-05-01",
      },
    });
    expect(amend.status(), await amend.text()).toBe(200);
    expect((await amend.json()).change.previous_values.title).toContain("reporting pack");
    expect((await amend.json()).data.title).toContain("revised");

    const history = await request.get(`${root}/${rid}/objectives/${objectiveId}/history`, {
      headers: authHeaders(emp),
    });
    expect(history.status()).toBe(200);
    expect((await history.json()).data.length).toBeGreaterThanOrEqual(1);
  });

  test("assessment integration keeps sealing and objective ratings", async ({ request }) => {
    const emp = await loginApi(request, manifest.users.employee.email, manifest.password);
    const mgr = await loginApi(request, manifest.users.manager.email, manifest.password);
    const root = apiRoots()[1];
    const rid = objectivesReviewId;

    const self = await request.put(`${root}/${rid}/submit-self`, {
      headers: authHeaders(emp),
      data: {
        self_assessment: completeSelfAssessment({
          achievements_impact: "E2E_OBJ_SELF",
          objective_assessments: [
            {
              objective_id: objectiveId,
              achievement: "Met target",
              evidence: "Pack archive",
            },
          ],
        }),
      },
    });
    expect(self.status(), await self.text()).toBe(200);

    const sealed = await request.get(`${root}/${rid}`, { headers: authHeaders(mgr) });
    const sealedBody = await sealed.json();
    const sealedData = sealedBody.data ?? sealedBody;
    expect(sealedData.self_assessment_sealed).toBe(true);
    expect(sealedData.self_assessment).toBeNull();
    expect(Array.isArray(sealedData.objectives)).toBeTruthy();
    expect(sealedData.objectives.length).toBeGreaterThanOrEqual(1);

    const badNa = await request.put(`${root}/${rid}/manager-review`, {
      headers: authHeaders(mgr),
      data: {
        manager_review: {
          ...validManagerReview(),
          objective_assessments: [
            {
              objective_id: objectiveId,
              rating: "N/A",
              rating_explanation: "",
              actual_result: "",
              evidence: "",
            },
          ],
        },
      },
    });
    expect(badNa.status()).toBe(422);

    const submit = await request.put(`${root}/${rid}/manager-review`, {
      headers: authHeaders(mgr),
      data: {
        manager_review: {
          ...validManagerReview(),
          objective_assessments: [
            {
              objective_id: objectiveId,
              rating: "4",
              actual_result: "Exceeded",
              evidence: "Metrics",
              went_well: "Ownership",
              not_met_reason: "",
              dependency_changes: "None",
              continue_stop_differently: "Continue",
            },
          ],
        },
      },
    });
    expect(submit.status(), await submit.text()).toBe(200);
    const body = await submit.json();
    expect(body.status).toBe("hr_review");
    expect(body.self_assessment?.achievements_impact).toBe("E2E_OBJ_SELF");
    expect(body.manager_review?.objective_assessments?.[0]?.rating).toBe("4");
  });

  test("UI: objectives panel on review detail", async ({ page }) => {
    await loginUi(page, manifest.users.manager.email, manifest.password);
    await page.goto(`/performance/${objectivesReviewId}`);
    await expect(page.getByTestId("objectives-panel")).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/reporting pack|revised/i).first()).toBeVisible();
  });

  test("historical review without objectives still readable", async ({ request }) => {
    const hr = await loginApi(request, manifest.users.hr.email, manifest.password);
    const show = await request.get(`${apiRoots()[1]}/${manifest.historical_review_id}`, {
      headers: authHeaders(hr),
    });
    expect(show.status()).toBe(200);
    const showJson = await show.json();
    const data = showJson.data ?? showJson;
    expect(data.self_assessment?.achievements).toBe("HIST_ACHIEVEMENT");
    expect(data.objectives || []).toEqual([]);
  });
});
