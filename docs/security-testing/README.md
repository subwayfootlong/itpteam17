# Security testing (SNFR-04/05)

Test cases, evidence and regression testing for every security requirement
(SFR-01 to SFR-08, SNFR-01 to SNFR-03). Tracks GitHub issue #57.

| File | Contents |
|---|---|
| `test-cases.md` | One test case per requirement: preconditions, steps, expected result, actual result, status, evidence link |
| `defects.md` | Every failed check, its evidence, the fix and the retest |
| `evidence/runs/<run>/<TC-ID>/` | Evidence from one test run (see below) |

## Running the tests

```bash
npm run build            # tests run against a production build
npm run test:security    # starts the server if needed, runs all test cases
npm run test:security:report   # opens Playwright's HTML report of the last run
```

Run one test case: `npx playwright test tests/security/tc-sfr-01.spec.ts`

The SFR-05 suites from the earlier work still run separately: `npm run test:sfr05`.

### What `.env.local` needs

| Variable | Needed for |
|---|---|
| `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET` | Everything |
| `UAT_PASSWORD` | Logging in the UAT test accounts |
| `MEMBERSHIP_QR_SECRET` | SFR-07 (membership QR) |
| `EMAIL_CHANGE_SECRET` | SFR-08 (email change) |
| `SMTP_PASSWORD` | Steps that actually send email. **Not configured yet**: those steps are recorded as "Not run" in the evidence, not skipped silently |

## Test accounts

| Role in tests | Account | Notes |
|---|---|---|
| `admin` | admin3@uat.pergas.org | |
| `memberA` | member3@uat.pergas.org | Basic tier |
| `memberB` | member4@uat.pergas.org | Basic tier, the "other member" in ownership tests |
| `memberC` | member5@uat.pergas.org | Basic tier, spare |

These are separate from the accounts the SFR-05 suites use (member1, member2,
admin2), so the two never edit the same records. admin1 is not used because its
password was changed. Every UAT member is on the basic tier, so tier tests
(SFR-03) create their own tier-locked content through the admin API and delete
it afterwards instead of changing anyone's tier.

All tests run against the live UAT Supabase project: they only use these
accounts, and anything they create is deleted at the end of the test.

## Evidence

Each run gets a timestamped folder, for example `evidence/runs/2026-10-29T14-05-12/`,
with one sub-folder per test case:

| File | Contents |
|---|---|
| `summary.md` | Table of every check: step, expected, actual, PASS/FAIL, plus steps that could not run |
| `results.json` | The same, machine-readable |
| `http.log` | Requests and responses. Cookie values and auth headers are redacted; cookie names and flags are kept |
| `*.png` | Screenshots |

Not every run needs committing. Commit:

- the **baseline run** (first full run of all test cases),
- the **failing run** for each defect (before),
- the **retest run** after each fix (after),
- the **final regression run**.

## Defect workflow

1. A check fails → log it in `defects.md` as `DEF-nn` with the failing test case,
   step and evidence folder. Status `Open`.
2. The requirement's owner confirms it offline. Status `Confirmed` (or `Rejected`,
   with the reason).
3. Fixes are made on this branch. Status `Fixed`, with the commit.
4. The same test case is rerun and the retest evidence linked. Status `Closed`.
5. After all fixes, a full regression run (`npm run test:security` and
   `npm run test:sfr05`) confirms existing workflows still work.
