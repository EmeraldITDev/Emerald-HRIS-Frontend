import { defineConfig, mergeConfig, type ConfigEnv, type UserConfig } from "vite";
import path from "path";
import baseConfig from "./vite.config";

// Playwright-only Vite config (see playwright.config.ts). Same as vite.config.ts,
// except `@/config/api` resolves to e2e/api.config.ts so the app talks to the
// isolated local test API rather than the production backend.
const apiPort = process.env.E2E_API_PORT || "8010";

export default defineConfig((env: ConfigEnv) =>
  mergeConfig(
    (baseConfig as (env: ConfigEnv) => UserConfig)(env),
    {
      define: {
        __E2E_API_ORIGIN__: JSON.stringify(`http://127.0.0.1:${apiPort}`),
      },
      resolve: {
        alias: [
          {
            find: /^@\/config\/api$/,
            replacement: path.resolve(__dirname, "./e2e/api.config.ts"),
          },
        ],
      },
    },
  ),
);
