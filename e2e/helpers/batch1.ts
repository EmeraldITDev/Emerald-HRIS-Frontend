import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { APIRequestContext, expect, Page } from "@playwright/test";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../../../hris-backend");

export type Batch1Manifest = {
  database: string;
  period: string;
  password: string;
  secret_token: string;
  review_id: number;
  na_review_id: number;
  discussion_review_id?: number;
  draft_self_review_id?: number;
  draft_manager_review_id?: number;
  historical_review_id?: number;
  users: {
    employee: { email: string; id: number };
    manager: { email: string; id: number };
    other_manager: { email: string; id: number };
    peer: { email: string; id: number };
    hr: { email: string; id: number };
  };
};

/** Full guide §6 manager payload for Batch 3 validation (also used by Batch 1 submit). */
export function validManagerReview(overrides: Record<string, string> = {}) {
  return {
    objectives_clear: "Yes",
    measures_clear: "Yes",
    material_changes_recorded: "Not Applicable",
    objective_assessments_narrative: "Objective delivery met agreed targets with evidence.",
    performance_assessment: "Independent manager assessment evidence.",
    behaviour_skills_rating: "3",
    behaviour_skills_example: "Applied core skills on assigned work.",
    behaviour_collaboration_rating: "3",
    behaviour_collaboration_example: "Collaborated with the team on delivery.",
    behaviour_ownership_rating: "3",
    behaviour_ownership_example: "Owned assigned work through to completion.",
    behaviour_learning_rating: "3",
    behaviour_learning_example: "Acted on prior feedback.",
    strengths: "Delivery",
    areas_for_improvement: "Documentation",
    recommendations: "Coaching — manager — 2026-12-01",
    ratings: "3",
    comments: "MANAGER_ONLY_RATIONALE",
    next_priorities: "H2 priorities",
    development_action: "Coaching",
    development_owner: "Manager",
    development_target_date: "2026-12-01",
    manager_support: "Weekly check-ins",
    pip_recommended: "No",
    ...overrides,
  };
}

export function completeSelfAssessment(overrides: Record<string, string> = {}) {
  return {
    achievements_impact: "Shipped reporting dashboard; reduced manual effort.",
    objective_results: "Obj1 target 100% — achieved 110% with evidence.",
    not_fully_achieved: "Obj2 delayed due to vendor lead time.",
    control_vs_external: "Vendor delay external; documentation gaps within control.",
    collaboration_example: "Paired with Finance to reconcile monthly packs.",
    ownership_professionalism: "Owned incidents; followed policies.",
    skills_applied: "SQL and stakeholder facilitation.",
    improvement_one_thing: "Earlier escalation of vendor risks.",
    support_needed: "BI training and clearer priority decisions.",
    next_priorities: "Stabilise reporting; mentor junior analyst.",
    ...overrides,
  };
}

export function loadManifest(): Batch1Manifest {
  const manifestPath = path.join(backendRoot, "database/e2e_batch1_manifest.json");
  if (!fs.existsSync(manifestPath)) {
    throw new Error(
      `Missing ${manifestPath}. Run: php scripts/e2e_batch1_prepare.php in hris-backend first.`,
    );
  }
  return JSON.parse(fs.readFileSync(manifestPath, "utf8")) as Batch1Manifest;
}

export function apiRoots(): string[] {
  const port = process.env.E2E_API_PORT || "8010";
  const host = `http://127.0.0.1:${port}`;
  return [`${host}/performance`, `${host}/api/performance`];
}

export async function loginApi(
  request: APIRequestContext,
  email: string,
  password: string,
): Promise<string> {
  const res = await request.post("http://127.0.0.1:" + (process.env.E2E_API_PORT || "8010") + "/api/auth/login", {
    data: { email, password },
  });
  expect(res.ok(), `login failed for ${email}: ${res.status()} ${await res.text()}`).toBeTruthy();
  const body = await res.json();
  const token = body.token || body.data?.token;
  expect(token, "login token missing").toBeTruthy();
  return token as string;
}

export async function loginUi(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await page.reload();
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).not.toHaveURL(/\/login/, { timeout: 30_000 });
}

export function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
  };
}
