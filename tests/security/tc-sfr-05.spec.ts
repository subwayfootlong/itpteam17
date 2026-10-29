import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { test, expect } from "./support/fixtures";

// TC-SFR-05 Database access control (test-cases.md)
// Steps 1-2 run the existing SFR-05 suites; steps 3-4 check the service-role key
// never reaches the browser.
test("TC-SFR-05 database access control", async ({ evidence, pageAs, baseURL }) => {
  test.setTimeout(300_000);
  const ev = evidence.start("TC-SFR-05", "Database access control");

  function runSuite(step: string, script: string, summary: RegExp) {
    const res = spawnSync("npm", ["run", script], {
      cwd: process.cwd(),
      shell: true,
      encoding: "utf8",
      env: { ...process.env, BASE_URL: baseURL },
      timeout: 240_000,
    });
    const output = `${res.stdout ?? ""}${res.stderr ?? ""}`;
    fs.writeFileSync(path.join(ev.dir, `${script.replace(/:/g, "-")}.log`), output);
    const line = output.split(/\r?\n/).filter((l) => summary.test(l)).pop()?.trim() ?? "(no summary line)";
    ev.check(`${step} npm run ${script}`, "exit 0, no failures", `exit ${res.status}; ${line}`, res.status === 0);
  }

  // Step 1: database-level RLS checks as the anonymous role.
  runSuite("1", "test:sfr05:rls", /passed,|failed/);
  // Step 2: server authorisation and workflow suites.
  runSuite("2", "test:sfr05:authz", /Passed:|Failed:/);
  runSuite("2", "test:sfr05:workflows", /Summary/);

  // Step 3: the service-role key and the server client never appear in browser code.
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
  const staticDir = path.join(process.cwd(), ".next", "static");
  const bundle = fs.existsSync(staticDir) ? walk(staticDir).filter((f) => /\.(js|css|json|html)$/.test(f)) : [];
  const hits = bundle.filter((f) => {
    const src = fs.readFileSync(f, "utf8");
    return (key.length > 20 && src.includes(key)) || src.includes("SUPABASE_SERVICE_ROLE_KEY") || src.includes("supabaseAdmin");
  });
  ev.check("3 browser bundle (.next/static) scanned", `${bundle.length} files, 0 contain the key or supabaseAdmin`, `${bundle.length} files, ${hits.length} contain it${hits.length ? `: ${hits.map((f) => path.basename(f)).join(", ")}` : ""}`, bundle.length > 0 && hits.length === 0);

  const page = await pageAs("memberA");
  for (const url of ["/", "/member", "/member/events", "/member/benefit", "/member/community", "/member/profile"]) {
    await page.goto(url);
    const html = await page.content();
    const found = (key.length > 20 && html.includes(key)) || html.includes("SUPABASE_SERVICE_ROLE_KEY");
    ev.check(`3 page HTML ${url}`, "no service-role key", found ? "KEY FOUND" : "not found", !found);
  }

  // Step 4 (inspection): where the key is read.
  const readers = walk(path.join(process.cwd(), "app"))
    .concat(walk(path.join(process.cwd(), "lib")), walk(path.join(process.cwd(), "components")))
    .filter((f) => /\.(ts|tsx)$/.test(f) && fs.readFileSync(f, "utf8").includes("SUPABASE_SERVICE_ROLE_KEY"))
    .map((f) => path.relative(process.cwd(), f).replace(/\\/g, "/"));
  ev.check("4 key read only in lib/supabaseServer.ts", "lib/supabaseServer.ts", readers.join(", ") || "(none)", readers.length === 1 && readers[0] === "lib/supabaseServer.ts");
  // Portal code and config only; the string is split so this test file can't match itself.
  const publicName = ["NEXT", "PUBLIC", "SUPABASE", "SERVICE", "ROLE"].join("_");
  const portalFiles = ["app", "lib", "components"]
    .flatMap((d) => walk(path.join(process.cwd(), d)))
    .concat(["next.config.ts", "proxy.ts", ".env.local.example"].map((f) => path.join(process.cwd(), f)).filter((f) => fs.existsSync(f)));
  const publicHits = portalFiles.filter((f) => fs.readFileSync(f, "utf8").includes(publicName));
  ev.check("4 no NEXT_PUBLIC_ service-role variable", "none", publicHits.length ? `FOUND in ${publicHits.map((f) => path.relative(process.cwd(), f)).join(", ")}` : "none", publicHits.length === 0);
  const server = fs.readFileSync(path.join(process.cwd(), "lib", "supabaseServer.ts"), "utf8");
  ev.check("4 lib/supabaseServer.ts refuses to load in a browser", "throws when window is defined", server.includes("typeof window !== 'undefined'") ? "guard present" : "guard MISSING", server.includes("typeof window !== 'undefined'"));
  const clientImports = walk(path.join(process.cwd(), "components"))
    .filter((f) => /\.(ts|tsx)$/.test(f) && /supabaseServer|supabaseAdmin/.test(fs.readFileSync(f, "utf8")));
  ev.check("4 no component imports the server client", "0 files", `${clientImports.length} files`, clientImports.length === 0);

  expect(ev.passed, "all TC-SFR-05 checks pass").toBe(true);
});

function walk(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    if (e.isDirectory()) {
      if (["node_modules", ".git", "test-results", "playwright-report"].includes(e.name)) return [];
      return walk(path.join(dir, e.name));
    }
    return [path.join(dir, e.name)];
  });
}
