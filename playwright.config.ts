import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../hris-backend");
const phpBin = path.join(backendRoot, ".tools/php");
const apiPort = process.env.E2E_API_PORT || "8010";
const webPort = process.env.E2E_WEB_PORT || "8080";
const apiBase = `http://127.0.0.1:${apiPort}`;

/**
 * Batch 1 Playwright config.
 * Spins up an isolated SQLite-backed Laravel API + Vite frontend.
 * Does not use production databases or real employee records.
 */
export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  timeout: 90_000,
  expect: { timeout: 15_000 },
  use: {
    baseURL: `http://127.0.0.1:${webPort}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    extraHTTPHeaders: {
      Accept: "application/json",
    },
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      command: `bash ${JSON.stringify(path.join(backendRoot, "scripts/e2e_batch1_serve.sh"))}`,
      cwd: backendRoot,
      url: `${apiBase}/up`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        E2E_API_PORT: apiPort,
      },
    },
    {
      command: `npm run dev -- --host 127.0.0.1 --port ${webPort}`,
      cwd: __dirname,
      url: `http://127.0.0.1:${webPort}`,
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        ...process.env,
        VITE_API_URL: `${apiBase}/api`,
      },
    },
  ],
});
