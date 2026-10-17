import { execFileSync } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "../../hris-backend");
const phpBin = path.join(backendRoot, ".tools/php");

/**
 * Rebuild the isolated Batch 1 SQLite database before Playwright runs.
 */
export default function globalSetup() {
  execFileSync(phpBin, ["scripts/e2e_batch1_prepare.php"], {
    cwd: backendRoot,
    stdio: "inherit",
    env: {
      ...process.env,
      APP_ENV: "local",
    },
  });
}
