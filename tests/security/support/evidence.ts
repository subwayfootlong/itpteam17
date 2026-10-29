import fs from "node:fs";
import path from "node:path";
import type { APIResponse, Page } from "@playwright/test";

// Evidence for one test case in one run, written to
//   docs/security-testing/evidence/runs/<runId>/<TC-ID>/
//     results.json   every check: expected vs actual, pass/fail
//     summary.md     the same as a readable table
//     http.log       requests made and the responses received
//     *.png          screenshots

export const EVIDENCE_ROOT = path.join(process.cwd(), "docs", "security-testing", "evidence", "runs");

export type Check = {
  step: string;
  expected: string;
  actual: string;
  pass: boolean;
};

export type SkippedCheck = { step: string; reason: string };

// Header values that must never be written to evidence files.
const REDACTED_HEADERS = new Set(["cookie", "set-cookie", "authorization"]);

export class Evidence {
  readonly dir: string;
  private checks: Check[] = [];
  private skipped: SkippedCheck[] = [];
  private httpLines: string[] = [];
  private screenshots: string[] = [];

  constructor(
    readonly testCaseId: string,
    readonly title: string,
    runId: string,
  ) {
    this.dir = path.join(EVIDENCE_ROOT, runId, testCaseId);
    fs.mkdirSync(this.dir, { recursive: true });
  }

  /** Record one expected-vs-actual check. Returns `pass` so callers can assert on it. */
  check(step: string, expected: string, actual: string, pass: boolean): boolean {
    this.checks.push({ step, expected, actual, pass });
    return pass;
  }

  /** Record a step that could not run (e.g. needs SMTP) so it is visible, not silently dropped. */
  skip(step: string, reason: string) {
    this.skipped.push({ step, reason });
  }

  /** Log a request/response pair. Cookies and auth headers are redacted; the body is truncated. */
  async http(label: string, method: string, url: string, res: APIResponse, requestBody?: unknown) {
    const headers = Object.entries(res.headers())
      .map(([k, v]) => `    ${k}: ${REDACTED_HEADERS.has(k.toLowerCase()) ? redactCookie(k, v) : v}`)
      .join("\n");
    let body = "";
    try {
      body = await res.text();
    } catch {
      body = "(no body)";
    }
    this.httpLines.push(
      [
        `### ${label}`,
        `> ${method} ${url}`,
        requestBody === undefined ? "" : `> body: ${truncate(JSON.stringify(requestBody), 500)}`,
        `< ${res.status()} ${res.statusText()}`,
        headers,
        `< body: ${truncate(body, 1500)}`,
        "",
      ]
        .filter(Boolean)
        .join("\n"),
    );
  }

  async screenshot(page: Page, name: string) {
    const file = `${String(this.screenshots.length + 1).padStart(2, "0")}-${slug(name)}.png`;
    await page.screenshot({ path: path.join(this.dir, file), fullPage: true });
    this.screenshots.push(file);
    return file;
  }

  get passed() {
    return this.checks.every((c) => c.pass);
  }

  write() {
    const result = {
      testCase: this.testCaseId,
      title: this.title,
      finishedAt: new Date().toISOString(),
      status: this.checks.length === 0 ? "NO CHECKS" : this.passed ? "PASS" : "FAIL",
      checks: this.checks,
      skipped: this.skipped,
      screenshots: this.screenshots,
    };
    fs.writeFileSync(path.join(this.dir, "results.json"), JSON.stringify(result, null, 2));
    if (this.httpLines.length) fs.writeFileSync(path.join(this.dir, "http.log"), this.httpLines.join("\n"));

    const esc = (s: string) => s.replace(/\|/g, "\\|").replace(/\n/g, " ");
    const md = [
      `# ${this.testCaseId}: ${this.title}`,
      "",
      `Status: **${result.status}**  ·  ${result.finishedAt}`,
      "",
      "| # | Step | Expected | Actual | Result |",
      "|---|---|---|---|---|",
      ...this.checks.map(
        (c, i) => `| ${i + 1} | ${esc(c.step)} | ${esc(c.expected)} | ${esc(c.actual)} | ${c.pass ? "PASS" : "**FAIL**"} |`,
      ),
      ...(this.skipped.length
        ? ["", "## Not run", "", ...this.skipped.map((s) => `- ${s.step}: ${s.reason}`)]
        : []),
      ...(this.screenshots.length ? ["", "## Screenshots", "", ...this.screenshots.map((f) => `- ![${f}](${f})`)] : []),
      "",
    ].join("\n");
    fs.writeFileSync(path.join(this.dir, "summary.md"), md);
  }
}

function redactCookie(name: string, value: string) {
  // Keep cookie names and flags (needed as SNFR-01 evidence), drop the token values.
  if (name.toLowerCase() !== "set-cookie") return "[redacted]";
  return value
    .split("\n")
    .map((line) => line.replace(/^([^=]+)=[^;]*/, "$1=[redacted]"))
    .join(" | ");
}

function truncate(s: string, max: number) {
  return s.length > max ? `${s.slice(0, max)}… (${s.length} chars)` : s;
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}
