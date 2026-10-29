import fs from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// Load .env.local (Supabase keys, UAT_PASSWORD, secrets) for the test process.
// The Next.js server loads it on its own.
if (fs.existsSync(".env.local")) process.loadEnvFile(".env.local");

// SNFR-04/05 security testing: browser-level checks and screenshot evidence.
// Runs against a production build (`npm run build` first), since cookie flags
// and error output differ in dev mode.
const PORT = Number(process.env.PORT ?? 3000);
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests/security",
  testMatch: "**/*.spec.ts",
  globalSetup: "./tests/security/support/global-setup.ts",
  // Tests share UAT accounts in the live database, so run them one at a time.
  workers: 1,
  fullyParallel: false,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  outputDir: "test-results",
  use: {
    baseURL: BASE_URL,
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npm run start -- -p ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 120_000,
  },
});
