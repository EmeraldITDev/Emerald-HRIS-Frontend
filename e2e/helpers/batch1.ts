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
  users: {
    employee: { email: string; id: number };
    manager: { email: string; id: number };
    other_manager: { email: string; id: number };
    peer: { email: string; id: number };
    hr: { email: string; id: number };
  };
};

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
