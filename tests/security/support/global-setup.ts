import fs from "node:fs";
import path from "node:path";
import { EVIDENCE_ROOT } from "./evidence";

// Runs once before all security tests: checks the environment and gives the run an id
// so every test case's evidence for this run lands in the same folder.
export default function globalSetup() {
  const missing = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "JWT_SECRET", "UAT_PASSWORD"].filter(
    (k) => !process.env[k],
  );
  if (missing.length) {
    throw new Error(`Missing in .env.local: ${missing.join(", ")}`);
  }

  // e.g. 2026-10-29T14-05-12
  const runId = process.env.SECURITY_RUN_ID ?? new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  process.env.SECURITY_RUN_ID = runId;
  fs.mkdirSync(path.join(EVIDENCE_ROOT, runId), { recursive: true });

  const optional = ["SMTP_PASSWORD"].filter((k) => !process.env[k]);
  console.log(`\nSecurity test run ${runId}`);
  console.log(`Evidence: docs/security-testing/evidence/runs/${runId}/`);
  if (optional.length) console.log(`Not configured (dependent steps are skipped): ${optional.join(", ")}\n`);
}
