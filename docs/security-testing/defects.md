# Defect log

Failed security checks found by the SNFR-04/05 test cases. Workflow and status
meanings are in [README.md](README.md#defect-workflow).

Status: `Open` → `Confirmed` / `Rejected` → `Fixed` → `Closed`

| ID | Test case / step | Requirement | Severity | Description | Evidence (before) | Status | Fix | Retest evidence (after) |
|---|---|---|---|---|---|---|---|---|
| DEF-01 | Code inspection during setup (not a test case) | SNFR-03, general | Medium | The shared UAT account password is hardcoded in `tests/test-server-authorization.mjs` (lines 9, 14) and `tests/test-workflow-regression.mjs` (lines 8, 13, 18). The repository is public, so anyone can sign in as these member and admin test accounts on any deployment that uses this database. Suggested fix: read it from `UAT_PASSWORD` in `.env.local` (as `tests/security/` does) and change the UAT password, since it is already in the git history. | Lines listed in the description | Open | — | — |
